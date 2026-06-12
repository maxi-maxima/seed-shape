# 安全策略

## 支持版本

`seed-shape` 仍处于 1.0 之前。安全修复会面向最新发布的小版本。

## 报告漏洞

优先使用 GitHub 的 private security advisory。如果不可用，请创建 issue，但只写最小必要描述，避免公开可直接利用的 payload。

## 范围

`seed-shape` 设计为本地运行，不连接数据库，也不连接外部服务。需要关注的安全面包括：

- 文件路径处理；
- 生成 SQL 的转义；
- 解析器拒绝服务场景；
- fixture 中意外包含密钥。

不要把真实凭证、生产记录或客户隐私数据放进 schema 示例或生成的 fixture。
