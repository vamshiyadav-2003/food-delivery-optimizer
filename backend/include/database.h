#ifndef DATABASE_H
#define DATABASE_H

#if defined(__has_include)
#  if __has_include(<mysqlx/xdevapi.h>)
#    include <mysqlx/xdevapi.h>
#  endif
#endif

class Database
{
public:
    bool connect();
};

#endif