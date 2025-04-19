package com.emailservice.email.service;

import com.emailservice.email.controller.payload.EmailPayload;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailSenderService {

    private final JavaMailSender mailSender;

    @Autowired
    public MailSenderService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void send(EmailPayload emailPayload) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo("gxkurro@yandex.ru");
        mailMessage.setSubject(emailPayload.subject());
        mailMessage.setText(emailPayload.text());
        mailMessage.setFrom("gxkurro@yandex.ru");

        mailSender.send(mailMessage);
    }

}
