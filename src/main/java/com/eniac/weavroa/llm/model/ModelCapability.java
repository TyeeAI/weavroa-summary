package com.eniac.weavroa.llm.model;

import lombok.Getter;

/**
 * 模型能力类型
 */
@Getter
public enum ModelCapability {

    /**
     * 文本生成/对话
     */
    TEXT("文本生成与对话");

    /**
     * 能力描述
     */
    private final String description;

    ModelCapability(String description) {
        this.description = description;
    }
}