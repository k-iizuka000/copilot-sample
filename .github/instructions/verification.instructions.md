---
applyTo: "**/*test*,**/*spec*,**/.github/workflows/**,**/Makefile,**/justfile,**/Taskfile.*,**/scripts/**,**/bin/**"
---

# Verification Instructions

behavior を検証するとき:

- 既存 project scripts と CI commands を先に使う。
- 高コストな full-suite commands より前に、最小限で意味のある check を実行する。
- output は要約し、important failure lines だけを含める。
- command または flow を実際に実行していない限り、success と主張しない。
- runtime behavior が重要な場合は、compile または install だけでなく、
  realistic smoke check を含める。

すべての verification summary には次を含める。

- command
- result
- evidence
- what remains unverified
