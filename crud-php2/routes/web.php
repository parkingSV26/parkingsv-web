<?php

return [
    '/' => 'HomeController@index',
    '/parqueos' => 'ParkingController@index',
    '/parqueo' => 'ParkingController@show',
    '/reservar' => 'ReservationController@create',
];
