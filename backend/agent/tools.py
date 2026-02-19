RETRIEVE_TOOL = {
    "type": "function",
    "function": {
        "name": "retrieve_documents",
        "description": (
            "Search the user's knowledge base for relevant document chunks. "
            "Call this when the question may be answered by the user's uploaded documents."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "A search query to find relevant content in the documents",
                }
            },
            "required": ["query"],
        },
    },
}
