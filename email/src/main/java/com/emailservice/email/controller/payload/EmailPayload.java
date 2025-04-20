package com.emailservice.email.controller.payload;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailPayload(
        @NotBlank
        @Size(min = 5, max = 100, message = "Тема письма должна быть в пределах от 5 до 100 символов")
        String subject,
        @NotBlank
        @Size(min = 5, max = 500, message = "Текст письма должен быть в пределах от 5 до 500 символов")
        String text) {
}
