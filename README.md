**similar pages** uses machine learning and graph theory to help you find connections between ideas.

coming soon to roam depot.

## how it works

for a given page in your graph, we calculate how similar the other pages are along two dimensions:
* how close together they are in the graph (using [Dijkstra's shortest path](https://graphology.github.io/standard-library/shortest-path.html#dijkstra))
* how similar they are according to machine learning (using [Universal Sentence Encoder](https://github.com/tensorflow/tfjs-models/tree/master/universal-sentence-encoder))

this is meant to help surface pages that are far apart, but similar:

![image](https://user-images.githubusercontent.com/1139703/201499109-337ea065-c53e-4226-9349-343acd06aa05.png)


## usage
after installing, click the new graph button next to the search input:

<img src="https://user-images.githubusercontent.com/1139703/201499087-0b651331-ad51-45e8-a747-1e652160660c.png" width="400"/>

then select a page to get started:

<img src="https://user-images.githubusercontent.com/1139703/201499310-e93b4091-fa1e-44fa-9491-7980928938af.png" width="300"/>

## technical details

everything is client side, your data never leaves roam. this plugin uses webworkers and indexeddb to make that possible.

## acknowledgements

Credit to Stephen Solka, creator of [logseq-graph-analysis](https://github.com/trashhalo/logseq-graph-analysis), which has served as a source of inspiration and guidance for representing
a tft graph with [graphology](https://graphology.github.io/).
