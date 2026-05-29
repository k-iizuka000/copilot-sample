---
applyTo: "**/*.sql,**/migrations/**,**/migration/**,**/db/**,**/schema/**,**/*Entity.java,**/*Repository.java,**/*Dao.java,**/*Mapper.java,**/src/main/resources/db/**"
---

# データベース指示

- 本番 DB の変更は migration として管理し、手動変更を前提にしない。
- 適用済み migration は編集せず、新しい migration で前進させる。
- schema 変更と data backfill は可能な限り分ける。
- 大きなテーブルではロック、全件更新、インデックス作成方式を確認する。
- 削除、rename、NOT NULL 追加は expand-contract など段階的な移行を検討する。
- Repository はクエリ意図を明確にし、N+1、過剰取得、ページング漏れを確認する。
- Entity は軽量に保ち、読み取り用途では DTO や projection を検討する。
- migration には検証方法、rollback または forward fix 方針を残す。
