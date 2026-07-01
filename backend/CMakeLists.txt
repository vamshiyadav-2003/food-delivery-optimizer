cmake_minimum_required(VERSION 3.20)

project(FoodDeliveryOptimizer)

set(CMAKE_CXX_STANDARD 17)

include_directories(
    include
    "C:/Program Files/MySQL/MySQL Connector C++ 9.7/include"
)

link_directories(
    "C:/Program Files/MySQL/MySQL Connector C++ 9.7/lib64"
)

add_executable(FoodDeliveryOptimizer
    src/server.cpp
    src/database.cpp
    src/graph.cpp
)

target_link_libraries(FoodDeliveryOptimizer
    mysqlcppconnx
)