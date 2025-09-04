#!/bin/bash

# 子图部署脚本
echo "🚀 开始部署 USDT Data Tracker 子图..."

# 检查是否安装了 graph-cli
if ! command -v graph &> /dev/null; then
    echo "❌ graph-cli 未安装，正在安装..."
    npm install -g @graphprotocol/graph-cli
fi

# 清理旧的生成文件
echo "🧹 清理旧文件..."
rm -rf generated/
rm -rf build/

# 重新生成代码
echo "📝 生成类型..."
npm run codegen

if [ $? -ne 0 ]; then
    echo "❌ 代码生成失败！请检查 schema.graphql 和 subgraph.yaml"
    exit 1
fi

# 构建子图
echo "🔨 构建子图..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！请检查 mapping.ts 文件"
    exit 1
fi

# 部署到 Graph Studio
echo "🌐 部署到 Graph Studio..."
npm run deploy

if [ $? -eq 0 ]; then
    echo "✅ 子图部署成功！"
    echo "📊 您可以在 Graph Studio 中查看部署状态"
    echo "🔗 URL: https://thegraph.com/studio/"
else
    echo "❌ 部署失败！请检查网络连接和认证信息"
    exit 1
fi
