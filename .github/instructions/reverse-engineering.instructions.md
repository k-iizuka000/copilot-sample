---
applyTo: "**"
---

# Reverse Engineering Instructions

未知の code に取り組むときは、まず既存 system を理解します。

- `rg --files` または同等の file listing から始める。
- implementation details を読む前に、manifest、config roots、entrypoints、
  tests、CI、containers、scripts を特定する。
- 大きな file や長い command output を response に貼り付けない。
- file paths 付きの compact map を優先する。
- README と docs は useful だが stale な可能性があるものとして扱う。
- ユーザーが明示的に implementation を依頼しない限り file を変更しない。

findings では次を分ける。

- verified facts
- source-backed inferences
- unverified assumptions
- remaining uncertainty
