# HANDOVER

> Updated: 2026-02-20
> Branch: main

## Current State

Phase 1-4 核心實作全部完成。專案已具備完整的 RAG 聊天功能：文件上傳、三段式檢索、tool calling、citation 持久化。教學文件與學習總結已同步產出。

目前為 **功能穩定狀態**，後續擴充建議在新分支進行。

## Done (this session)

- Phase 4 完成：三段式檢索 + citation 持久化 + system prompt 引用格式強化
- 所有教學文件同步更新（basic 主線 + rag/backend/frontend/database 專題）
- 學習總結文件產出：`.tutorial/rag/05-summary.md`
- PROGRESS 修正：vector search function 標完成，全文搜索拆出為獨立項目

## In Progress

無。Phase 1-4 主線已結束。

## Roadmap -- 後續擴充

### 第一優先：檢索品質量化與提升

1. **離線評測題組** -- 固定 10-20 題，量化 rerank + dynamic top-k 的品質提升
2. **Hybrid Search** -- 建立 tsvector index，合併 vector + keyword 結果
3. **中文斷詞（jieba）** -- 提升 keyword coverage 對中文的效果

### 第二優先：功能擴展

4. **Metadata Extraction** -- 自動抽取文件標題、作者、日期
5. **Sub-Agents** -- 拆分 retrieval / summarization / comparison 子任務
6. **Web Search Tool** -- agent 可搜尋網路，補充本地文件

### 第三優先：進階能力

7. **Text-to-SQL** -- agent 查詢結構化資料
8. **Rerank 模型替換** -- Cohere / Jina rerank 取代 heuristic
9. **Observability** -- LangSmith / Phoenix 追蹤呼叫鏈
10. **Multi-modal** -- 圖片 chunk 支援

### 建議做法

- 每個擴充項目在獨立分支開發
- 完成後更新對應教學文件
- 詳細規劃見 `.workflow/PROGRESS.md` 後續擴充區塊

## Reference Docs

- `.workflow/PLAN.md`
- `.workflow/PROGRESS.md`
- `.tutorial/rag/05-summary.md` -- 專案學習總結
- `.tutorial/rag/04-retrieval-tuning.md` -- 三段式檢索詳解
- `.tutorial/basic/07-rag-glossary.md` -- RAG 名詞表
