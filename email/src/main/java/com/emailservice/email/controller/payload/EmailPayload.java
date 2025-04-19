package com.emailservice.email.controller.payload;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailPayload(
        @NotBlank
        @Size(min = 5, max = 500, message = "Сообщение должно быть в пределах от 5 до 500 символов")
        String text) {
}
