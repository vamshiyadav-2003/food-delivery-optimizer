#include "graph.h"
#include <iostream>

using namespace std;

Graph::Graph(int vertices)
{
    V = vertices;
    adj.resize(V);
}

void Graph::addEdge(int u,int v,int weight)
{
    adj[u].push_back({v,weight});
    adj[v].push_back({u,weight});
}

void Graph::dijkstra(int source)
{
    priority_queue<
        pair<int,int>,
        vector<pair<int,int>>,
        greater<pair<int,int>>
    > pq;

    vector<int> distance(V,INT_MAX);

    distance[source]=0;

    pq.push({0,source});

    while(!pq.empty())
    {
        int node=pq.top().second;
        int dist=pq.top().first;

        pq.pop();

        for(auto edge:adj[node])
        {
            int next=edge.first;
            int weight=edge.second;

            if(distance[next]>dist+weight)
            {
                distance[next]=dist+weight;

                pq.push({distance[next],next});
            }
        }
    }

    cout<<"========= Shortest Distance ========="<<endl;

    for(int i=0;i<V;i++)
    {
        cout<<"Location "<<i<<" : "<<distance[i]<<" km"<<endl;
    }
}