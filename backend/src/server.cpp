#include "database.h"
#include "graph.h"

int main()
{
    // Connect to MySQL
    Database db;
    db.connect();

    // Graph for shortest route
    Graph city(6);

    city.addEdge(0,1,4);
    city.addEdge(0,2,2);
    city.addEdge(1,2,1);
    city.addEdge(1,3,5);
    city.addEdge(2,3,8);
    city.addEdge(2,4,10);
    city.addEdge(3,4,2);
    city.addEdge(3,5,6);
    city.addEdge(4,5,3);

    city.dijkstra(0);

    return 0;
}