import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Team } from '../src/teams/team.js';
import { Agent } from '../src/agents/agent.js';
import { LLMProvider } from '../src/llm/providers/base.js';
import type { LLMMessage, LLMResponse, AgentConfig } from '../src/types.js';
import { SlidingWindowConversationMemory } from '../src/memory/conversation.js';
import { ToolRegistry } from '../src/tools/registry.js';

class MockLLMProvider extends LLMProvider {
  private model: string;
  public responses: LLMResponse[] = [];
  private callCount = 0;

  constructor(model: string = 'mock-model', responses?: LLMResponse[]) {
    super();
    this.model = model;
    if (responses) this.responses = responses;
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'mock';
  }

  async complete(
    _messages: LLMMessage[],
    _options?: Record<string, unknown>,
  ): Promise<LLMResponse> {
    if (this.callCount < this.responses.length) {
      return this.responses[this.callCount++];
    }
    return {
      content: 'Default mock response',
      finishReason: 'stop',
      usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
    };
  }

  async *completeStream(
    _messages: LLMMessage[],
    _options?: Record<string, unknown>,
  ): AsyncIterable<LLMResponse> {
    const result = await this.complete(_messages, _options);
    yield result;
  }
}

function createMockAgent(id: string, name: string, provider?: LLMProvider): Agent {
  const config: AgentConfig = {
    id,
    name,
    description: `${name} description`,
    systemPrompt: `You are ${name}.`,
    model: 'mock-model',
    provider: 'openai',
    temperature: 0.7,
    maxTokens: 4096,
  };
  const mem = new SlidingWindowConversationMemory(50);
  const tools = new ToolRegistry();
  const llm = provider ?? new MockLLMProvider();
  return new Agent(config, llm, mem, tools);
}

describe('Team', () => {
  describe('creation and member management', () => {
    it('should create a team with name and description', () => {
      const team = new Team('Research Team', 'A team for research tasks');
      expect(team.name).toBe('Research Team');
      expect(team.description).toBe('A team for research tasks');
    });

    it('should add members with roles', () => {
      const team = new Team('Test Team', 'Test');
      const agent = createMockAgent('agent-1', 'Agent 1');

      team.addMember(agent, 'researcher');
      const members = team.getMembers();
      expect(members.size).toBe(1);
      expect(members.get('agent-1')).toBe(agent);
    });

    it('should set the leader when adding a member with leader role', () => {
      const team = new Team('Test Team', 'Test');
      const leader = createMockAgent('leader-1', 'Leader');
      const researcher = createMockAgent('res-1', 'Researcher');

      team.addMember(leader, 'leader');
      team.addMember(researcher, 'researcher');

      expect(team.getLeader()).toBe(leader);
    });

    it('should remove members by id', () => {
      const team = new Team('Test Team', 'Test');
      const agent = createMockAgent('agent-1', 'Agent 1');

      team.addMember(agent, 'executor');
      expect(team.getMembers().size).toBe(1);

      team.removeMember('agent-1');
      expect(team.getMembers().size).toBe(0);
    });

    it('should clear leader when leader is removed', () => {
      const team = new Team('Test Team', 'Test');
      const leader = createMockAgent('leader-1', 'Leader');

      team.addMember(leader, 'leader');
      expect(team.getLeader()).toBe(leader);

      team.removeMember('leader-1');
      expect(team.getLeader()).toBeNull();
    });
  });

  describe('multi-agent delegation', () => {
    it('should throw if no leader is assigned when running', async () => {
      const team = new Team('Orphan Team', 'No leader');
      const agent = createMockAgent('agent-1', 'Agent 1');
      team.addMember(agent, 'researcher');

      await expect(team.run('Do something')).rejects.toThrow('Team has no leader assigned');
    });

    it('should run with leader only when no other roles present', async () => {
      const leaderProvider = new MockLLMProvider('leader-model', [
        {
          content: 'Leader response',
          finishReason: 'stop',
          usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
        },
      ]);
      const leader = createMockAgent('leader-1', 'Leader', leaderProvider);

      const team = new Team('Simple Team', 'Simple');
      team.addMember(leader, 'leader');

      const result = await team.run('Do task');
      expect(result.output).toBe('Leader response');
      expect(result.contributions.length).toBe(1);
      expect(result.contributions[0].role).toBe('leader');
    });

    it('should run researcher, executor, reviewer, and leader in sequence', async () => {
      const leaderProv = new MockLLMProvider('leader', [
        { content: 'Final consolidated output', finishReason: 'stop' },
      ]);
      const researcherProv = new MockLLMProvider('researcher', [
        { content: 'Research findings data', finishReason: 'stop' },
      ]);
      const executorProv = new MockLLMProvider('executor', [
        { content: 'Execution output', finishReason: 'stop' },
      ]);
      const reviewerProv = new MockLLMProvider('reviewer', [
        { content: 'Review approved', finishReason: 'stop' },
      ]);

      const leader = createMockAgent('leader-1', 'Leader', leaderProv);
      const researcher = createMockAgent('res-1', 'Researcher', researcherProv);
      const executor = createMockAgent('exec-1', 'Executor', executorProv);
      const reviewer = createMockAgent('rev-1', 'Reviewer', reviewerProv);

      const team = new Team('Full Team', 'Team with all roles');
      team.addMember(leader, 'leader');
      team.addMember(researcher, 'researcher');
      team.addMember(executor, 'executor');
      team.addMember(reviewer, 'reviewer');

      const result = await team.run('Build something');

      expect(result.output).toBe('Final consolidated output');
      expect(result.contributions.length).toBe(4);

      const roles = result.contributions.map((c) => c.role);
      expect(roles).toContain('leader');
      expect(roles).toContain('researcher');
      expect(roles).toContain('executor');
      expect(roles).toContain('reviewer');

      const research = result.contributions.find((c) => c.role === 'researcher');
      expect(research?.output).toBe('Research findings data');

      const executed = result.contributions.find((c) => c.role === 'executor');
      expect(executed?.output).toBe('Execution output');
    });

    it('should run with only researcher and leader when no executor/reviewer', async () => {
      const leaderProv = new MockLLMProvider('leader', [
        { content: 'Leader answer', finishReason: 'stop' },
      ]);
      const researcherProv = new MockLLMProvider('researcher', [
        { content: 'Research info', finishReason: 'stop' },
      ]);

      const leader = createMockAgent('leader-1', 'Leader', leaderProv);
      const researcher = createMockAgent('res-1', 'Researcher', researcherProv);

      const team = new Team('Partial Team', 'Only research');
      team.addMember(leader, 'leader');
      team.addMember(researcher, 'researcher');

      const result = await team.run('Research topic');
      expect(result.contributions.length).toBe(2);
      expect(result.contributions.some((c) => c.role === 'researcher')).toBe(true);
    });

    it('should measure duration', async () => {
      const leader = createMockAgent(
        'leader-1',
        'Leader',
        new MockLLMProvider('leader', [{ content: 'Done', finishReason: 'stop' }]),
      );

      const team = new Team('Timed Team', 'Testing duration');
      team.addMember(leader, 'leader');

      const result = await team.run('Quick task');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
