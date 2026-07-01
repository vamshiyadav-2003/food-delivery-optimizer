#ifndef GRAPH_H
#define GRAPH_H

#include <vector>
#include <queue>
#include <climits>

using namespace std;

class Graph
{
    int V;
    vector<vector<pair<int,int>>> adj;

public:
    Graph(int vertices);

    void addEdge(int u,int v,int weight);

    void dijkstra(int source);
};

#endif