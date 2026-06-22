from typing import Dict, Any
from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.classifier import classify_email
from app.agents.summarizer import summarize_email
from app.agents.replier import generate_replies
from app.agents.scheduler import process_scheduling
from app.agents.task_extractor import extract_tasks

# Define Node Wrapper functions that return modified State properties
def classification_node(state: AgentState) -> Dict[str, Any]:
    print("[Agent Workflow] Running Classification Node...")
    res = classify_email(state)
    return {
        "category": res["category"],
        "priority": res["priority"],
        "sentiment": res["sentiment"]
    }

def summarization_node(state: AgentState) -> Dict[str, Any]:
    print("[Agent Workflow] Running Summarization Node...")
    res = summarize_email(state)
    return {"summary": res["summary"]}

def replier_node(state: AgentState) -> Dict[str, Any]:
    print("[Agent Workflow] Running Smart Reply Generator Node...")
    res = generate_replies(state)
    return {"suggested_replies": res["suggested_replies"]}

def scheduler_node(state: AgentState) -> Dict[str, Any]:
    print("[Agent Workflow] Running Calendar Scheduling Node...")
    res = process_scheduling(state)
    return {"calendar_actions": res["calendar_actions"]}

def task_extractor_node(state: AgentState) -> Dict[str, Any]:
    print("[Agent Workflow] Running Action Item Extractor Node...")
    res = extract_tasks(state)
    return {"action_items": res["action_items"]}

def init_node(state: AgentState) -> Dict[str, Any]:
    print("[Agent Workflow] Initializing State pipeline...")
    # Inject defaults if missing
    return {
        "category": state.get("category", "Personal"),
        "priority": state.get("priority", "Medium"),
        "summary": state.get("summary", ""),
        "sentiment": state.get("sentiment", "Neutral"),
        "action_items": state.get("action_items", []),
        "suggested_replies": state.get("suggested_replies", {}),
        "calendar_actions": state.get("calendar_actions", {}),
        "user_preferences": state.get("user_preferences", {}),
        "frequent_contacts": state.get("frequent_contacts", [])
    }

# Build workflow Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("init", init_node)
workflow.add_node("classifier", classification_node)
workflow.add_node("summarizer", summarization_node)
workflow.add_node("replier", replier_node)
workflow.add_node("scheduler", scheduler_node)
workflow.add_node("task_extractor", task_extractor_node)

# Set entry point
workflow.set_entry_point("init")

# Route to parallel agents from init
workflow.add_edge("init", "classifier")
workflow.add_edge("init", "summarizer")
workflow.add_edge("init", "replier")
workflow.add_edge("init", "scheduler")
workflow.add_edge("init", "task_extractor")

# Route parallel agents back to End (LangGraph merges properties naturally in State)
workflow.add_edge("classifier", END)
workflow.add_edge("summarizer", END)
workflow.add_edge("replier", END)
workflow.add_edge("scheduler", END)
workflow.add_edge("task_extractor", END)

# Compile the execution graph
app_graph = workflow.compile()
