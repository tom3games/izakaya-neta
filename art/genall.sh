#!/bin/zsh
# 全部生成。まず元の人物と背景（5並列）、次に表情差分（5並列）
P="$(cd "$(dirname "$0")" && pwd)"
print -l bucho senpai doki kohai shotai univ motokano oji tenin bg | xargs -P 5 -I{} $P/gen.sh {}
for k in bucho senpai doki kohai shotai univ motokano oji; do print ${k}_h; print ${k}_c; done | xargs -P 5 -I{} $P/gen.sh {}
echo ALLDONE
