package com.eniac.weavroa.summary.api;

import com.eniac.weavroa.llm.factory.ModelFactory;
import com.eniac.weavroa.llm.model.chat.Message;
import com.eniac.weavroa.summary.entity.Result;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

/**
 * 文本总结接口：对输入全文进行结构化摘要，SSE 流式返回增量文本
 */
@RestController
@RequestMapping("/api/v1/summary")
@AllArgsConstructor
public class SummaryController {

    private final ModelFactory modelFactory;

    /**
     * 全文摘要：对话模型按信息整理提示词流式生成总结，逐帧返回 Result（data 为文本增量）
     */
    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Result> summary(@RequestBody Map<String, Object> json) {
        String message = json.get("message").toString();

        List<Message> build = Message.builder()
                .system("""
                        你是一个专业的信息整理助手。

                        你的任务是：
                        对用户输入的内容进行高质量、精炼、结构化总结。

                        要求：
                        1. 保留核心信息，删除废话、重复表达、情绪化语言。
                        2. 不要改变原意，不要添加用户未提及的信息。
                        3. 输出尽量简洁，但不能遗漏关键点。
                        4. 优先提炼：
                           - 目标
                           - 问题
                           - 结论
                           - 时间
                           - 人物
                           - 关键数据
                        5. 如果内容较长，请按条目分点总结。
                        6. 如果用户内容存在明确行动项，请单独列出。
                        7. 不输出“以下是总结”等客套话，直接开始总结。

                        输出风格：
                        - 简洁
                        - 清晰
                        - 专业
                        - 去口语化
                        """)
                .user(message)
                .build();

        return this.modelFactory.chatModel().generateStream(build)
                .map(resp -> resp.getChoices().getFirst().getMessage().getContent())
                .map(Result::success);
    }
}