<?php

set_exception_handler(function ($e) {
    http_response_code(500);
    require __DIR__ . '/../app/views/errors/500.php';
});
