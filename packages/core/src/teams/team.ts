import { nanoid } from 'nanoid';
import type { AgentRole, AgentRunResult } from '../types.js';
import { Agent } from '../agents/agent.js';

export class Team {
  private members: Map<string, { agent: Agent; role: AgentRole }> = new Map();
  private leader: Agent | null = null;

  constructor(
    public name: string,
    public description: string,
  ) {}

  addMember(agent: Agent, role: AgentRole): void {
    this.members.set(agent.getConfig().id, { agent, role });
    if (role === 'leader') {
      this.leader = agent;
    }
  }

  removeMember(agentId: string): void {
    const member = this.members.get(agentId);
    if (member && member.role === 'leader') {
      this.leader = null;
    }
    this.members.delete(agentId);
  }

  getMembers(): Map<string, Agent> {
    const agents = new Map<string, Agent>();
    for (const [id, { agent }] of this.members) {
      agents.set(id, agent);
    }
    return agents;
  }

  getLeader(): Agent | null {
    return this.leader;
  }

  async run(
    input: string,
    options?: { stream?: boolean },
  ): Promise<{
    output: string;
    contributions: Array<{ agentId: string; role: AgentRole; output: string }>;
    duration: number;
  }> {
    const startTime = Date.now();
    const contributions: Array<{ agentId: string; role: AgentRole; output: string }> = [];

    if (!this.leader) {
      throw new Error('Team has no leader assigned');
    }

    const researchers = this.getMembersByRole('researcher');
    const executors = this.getMembersByRole('executor');
    const reviewers = this.getMembersByRole('reviewer');

    const researchResults: string[] = [];
    for (const { agent } of researchers) {
      const result = await agent.run(
        `Research the following task and provide findings: ${input}`,
        options,
      );
      contributions.push({
        agentId: agent.getConfig().id,
        role: 'researcher',
        output: result.output,
      });
      researchResults.push(result.output);
    }

    const executionResults: string[] = [];
    if (executors.length > 0) {
      const execInput =
        researchResults.length > 0
          ? `Based on this research:\n${researchResults.join('\n')}\n\nExecute: ${input}`
          : input;

      for (const { agent } of executors) {
        const result = await agent.run(execInput, options);
        contributions.push({
          agentId: agent.getConfig().id,
          role: 'executor',
          output: result.output,
        });
        executionResults.push(result.output);
      }
    }

    const reviewInputs = executionResults.length > 0 ? executionResults : researchResults;
    const reviewResults: string[] = [];
    for (const { agent } of reviewers) {
      const reviewContent = reviewInputs.join('\n');
      const result = await agent.run(
        `Review the following output for correctness and quality:\n${reviewContent}`,
        options,
      );
      contributions.push({
        agentId: agent.getConfig().id,
        role: 'reviewer',
        output: result.output,
      });
      reviewResults.push(result.output);
    }

    const leaderContext = [
      researchResults.length > 0 ? `Research findings:\n${researchResults.join('\n')}` : '',
      executionResults.length > 0 ? `Execution results:\n${executionResults.join('\n')}` : '',
      reviewResults.length > 0 ? `Review feedback:\n${reviewResults.join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const leaderResult = await this.leader.run(
      leaderContext
        ? `Task: ${input}\n\nContributions from team:\n${leaderContext}\n\nProvide the final consolidated response.`
        : input,
      options,
    );

    contributions.push({
      agentId: this.leader.getConfig().id,
      role: 'leader',
      output: leaderResult.output,
    });

    const duration = Date.now() - startTime;
    return {
      output: leaderResult.output,
      contributions,
      duration,
    };
  }

  private getMembersByRole(role: AgentRole): Array<{ agent: Agent; role: AgentRole }> {
    return Array.from(this.members.values()).filter((m) => m.role === role);
  }
}
