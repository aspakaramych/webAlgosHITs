package com.emailservice.email.controller;

import com.emailservice.email.controller.payload.EmailPayload;
import com.emailservice.email.service.MailSenderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class EmailSenderController {

    private final MailSenderService mailSenderService;

    @Autowired
    public EmailSenderController(MailSenderService mailSenderService) {
        this.mailSenderService = mailSenderService;
    }

    @PostMapping("/contact/contact_us")
    public ResponseEntity<?> sendEmail(@RequestBody @Valid EmailPayload emailPayload,
                                            BindingResult bindingResult) {
        if(bindingResult.hasErrors()) {
            ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
            problemDetail.setProperty("error", bindingResult.getAllErrors().get(0).getDefaultMessage());
            return ResponseEntity.badRequest().body(problemDetail);
        }
        try {
            mailSenderService.send(emailPayload);
        } catch (Exception e) {
            ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
            problemDetail.setProperty("error", e.getMessage());
            return ResponseEntity.badRequest().body(problemDetail);
        }

        return ResponseEntity.ok(
                Map.of("message", "success")
        );
    }

}
