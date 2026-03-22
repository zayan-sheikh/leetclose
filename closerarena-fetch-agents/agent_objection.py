"""
CloserArena — Objection-handling specialist uAgent.
Run: cd closerarena-fetch-agents && python agent_objection.py
"""

from uagents import Agent, Context

from config import OBJ_SEED, ORCHESTRATOR_ADDRESS, PORT_OBJECTION
from gemini_util import generate
from models import DebriefState

SYSTEM = """You are a sales coach who ONLY evaluates objection handling on a coaching sales transcript.
Focus on: validation before reframe, tone, questions vs debating, handling price/time/partner stalls.
Write 4–8 bullet points tied to actual lines. Reference the transcript briefly."""


agent = Agent(
    name="closerarena_objection",
    seed=OBJ_SEED,
    port=PORT_OBJECTION,
    mailbox=False,
)


@agent.on_message(DebriefState)
async def handle(ctx: Context, sender: str, state: DebriefState):
    if state.step != "objection":
        return
    ctx.logger.info("Running objection specialist…")
    try:
        state.objection_feedback = generate(
            SYSTEM,
            f"Transcript:\n{state.transcript}",
        )
    except Exception as e:
        ctx.logger.error(str(e))
        state.objection_feedback = f"(Objection agent error: {e})"
    state.step = "close"
    await ctx.send(ORCHESTRATOR_ADDRESS, state)


if __name__ == "__main__":
    print("Objection uAgent — address:", agent.address)
    agent.run()
