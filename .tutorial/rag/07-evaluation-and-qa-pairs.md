# RAG 評測入門：QA Pair 到可重跑比較

## 先講結論

「丟問題看回答」很有價值，但那是 smoke test（主觀檢查）。

要進入工程化調參，還需要 evaluation（可重跑、可比較）。

## 什麼是 QA Pair

在 RAG 評測裡，建議至少有三層資料：

1. `Q`（Query）-- 問題本身
2. `A`（Answer）-- 參考答案或答案重點
3. `Evidence` -- 這題應該命中的證據段落（gold passages）

只寫 Q 不夠，因為無法客觀判斷「檢索到底有沒有撈對」。

## 為什麼這對現在專案很重要

當系統已有 hybrid/vector 雙模式時，下一步通常是調參：

- `rag_rrf_k`
- `rag_full_text_weight`
- `rag_semantic_weight`

沒有固定評測集，調參就會變成「感覺比較好」，很難複製結果。

## 最小可行評測流程（MVP）

1. 固定一份題組（10-20 題即可）
2. 每題標 expected evidence（先用段落線索也可以）
3. 同一批題目跑兩次：
   - `RAG_HYBRID_ENABLED=true`
   - `RAG_HYBRID_ENABLED=false`
4. 記錄每題是否命中 evidence

## 建議先看哪個指標

- `Hit@k`：前 k 個結果有沒有至少一段命中
- `Recall@k`：該命中的證據段落有幾段被撈到

先把這兩個做起來就夠了，不用一開始就追求複雜評分。

## 本專案已實作的評測集

- 檔案：[`eval/EVAL_PIANO_V1.yaml`](../../eval/EVAL_PIANO_V1.yaml)
- 主題：`鋼琴訓練的深層影響.pdf`
- 題數：10
- 格式：`query + query_type + expected_evidence + expected_answer_points`

## 目前限制

- `expected_evidence` 現在是段落線索，不是 `chunk_id`
- 後續建議在資料固定後，把 evidence 轉成 chunk_id，評測會更穩

## 下一步（升級版本時）

- 補一個小腳本，把每題 retrieval 結果輸出成表格
- 自動計算 hit@k、recall@k
- 把結果存成版本化報表（例如 `eval_reports/2026-02-20.md`）
