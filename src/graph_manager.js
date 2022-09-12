export default class GraphManager {
    constructor(nodes, edges, vis, vis_data) {
        this.nodes = nodes;
        this.edges = edges;
        this.vis = vis;
        this.vis_data = vis_data;
        this.name_2_id = {};
        this.id_2_name = {};
        this.center_nodes = [];
        this.hops = {};
        this.above = {};
        this.below = {};
        this.shortest_paths = {};

        for (const node of this.nodes) {
            this.name_2_id[node['iri']] = node['id']
            this.id_2_name[node['id']] = node['iri']
        }
    }

    get_node(id) {
        for (const node of this.nodes) {
            if (node['id'] === id) {
                return node
            }
        }
        console.log('Error in get_node(id) function - id does not exist in the dataset')
        return this.nodes[0]

    }

    add_hop(node, include_hierarchy) {
        /*
        Adds a 1 hop environment around the node with the given ID to the visualization.
        */

        if (!(node in this.hops)) {
            this.hops[node] = []
        }

        if (this.hops[node].length === 0) {
            let node_id = this.name_2_id[node];
            for (const edge of this.edges) {
                if (edge['from'] === node_id) {
                    this.hops[node].push(this.id_2_name[edge['to']]);
                }

                if (edge['to'] === node_id) {
                    this.hops[node].push(this.id_2_name[edge['from']]);
                }
            }
        }
        for (const node_string of this.hops[node]) {
            if (include_hierarchy === true || node_string.includes('Generale') || node_string.includes('Arbeitseinheit') || this.get_node(this.name_2_id[node_string])['image'].includes('/user-solid_new.svg')  ){
                this.add_node_to_vis(node_string)
            }

        }
    }

    add_above_below(node, above_or_below) {
        let nodes_dataset;
        let start;
        let end;

        if (above_or_below === 'above') {
            nodes_dataset = this.above;
            start = 'from';
            end = 'to';
        } else {
            nodes_dataset = this.below;
            start = 'to';
            end = 'from';
        }

        if (!(node in nodes_dataset)) {
            nodes_dataset[node] = [];
        }

        if (nodes_dataset[node].length === 0) {
            let node_id = this.name_2_id[node];
            let found_root = false;
            let current_layer = [node_id];
            let nodes_above_all = [];
            while (!found_root) {
                let nodes_above = []
                for (const edge of this.edges) {
                    if (current_layer.includes(edge[start])) {
                        nodes_above_all.push(this.id_2_name[edge[end]])
                        nodes_above.push(edge[end]);
                    }
                }
                current_layer = [...new Set(nodes_above)];
                if (current_layer.length === 0) {
                    found_root = true;
                }
            }

            for (const node_string of nodes_above_all) {
                nodes_dataset[node].push(node_string);
                this.add_node_to_vis(node_string)
            }
        }
    }


    remove_above_below(node, above_or_below) {
        let nodes_dataset;

        if (above_or_below === 'above') {
            nodes_dataset = this.above;
        } else {
            nodes_dataset = this.below;
        }

        let nodes_dataset_old = Object.assign({}, nodes_dataset);
        nodes_dataset[node] = []
        if (node in nodes_dataset_old) {
            for (const hop_node of nodes_dataset_old[node]) {
                if (!this.still_included(hop_node)) {
                    this.vis_data.nodes.remove(this.name_2_id[hop_node]);
                }
            }
        }
    }

    still_included(node) {
        let still_included = false;

        // center nodes
        if (this.center_nodes.includes(node)) {
            still_included = true;
        }

        // hop
        if (Object.values(this.hops).flat(1).includes(node)) {
            still_included = true;
        }

        // shortest path
        if (this.flatten_2d(this.shortest_paths).includes(node)) {
            still_included = true;
        }

        // above
        if (Object.values(this.above).flat(1).includes(node)) {
            still_included = true;
        }

        // below
        if (Object.values(this.below).flat(1).includes(node)) {
            still_included = true;
        }

        return still_included;
    }


    remove_hop(node) {
        let hops_old = Object.assign({}, this.hops);
        this.hops[node] = []
        if (node in hops_old) {
            for (const hop_node of hops_old[node]) {
                if (!this.still_included(hop_node)) {
                    this.vis_data.nodes.remove(this.name_2_id[hop_node]);
                }
            }
        }
    }

    dijkstra_get_neighbors_in_Q(u, Q) {
        let neighbors = [];

        for (const edge of this.edges) {
            if (this.id_2_name[edge['from']] === u) {
                if (Q.includes(this.id_2_name[edge['to']])) {
                    neighbors.push(this.id_2_name[edge['to']]);
                }
            }
            if (this.id_2_name[edge['to']] === u) {
                if (Q.includes(this.id_2_name[edge['from']])) {
                    neighbors.push(this.id_2_name[edge['from']]);
                }
            }
        }

        return neighbors;
    }


    dijkstra_get_node_in_Q_with_smallest_dist(Q, dist) {

        let next_node = Q[0];
        let next_dist = Infinity;

        for (const possible_next_node of Q) {
            if (dist[possible_next_node] < next_dist) {
                next_dist = dist[possible_next_node];
                next_node = possible_next_node;
            }
        }
        return (next_node);
    }

    dijkstra(start_node, end_node) {
        // initialize distances
        let dist = {};
        let prev = {};
        let Q = [];

        for (const node of this.nodes) {
            dist[node['iri']] = Infinity;
            prev[node['iri']] = '';
            Q.push(node['iri']);
        }
        dist[start_node] = 0;

        while (Q.length !== 0) {
            let u = this.dijkstra_get_node_in_Q_with_smallest_dist(Q, dist)

            // remove u from Q
            var index = Q.indexOf(u);
            if (index !== -1) {
                Q.splice(index, 1);
            }

            // for each neighbor v of u still in Q
            for (const v of this.dijkstra_get_neighbors_in_Q(u, Q)) {
                let alt = dist[u] + 1;
                if (alt < dist[v]) {
                    dist[v] = alt;
                    prev[v] = u;
                }
            }
        }

        let shortest_path = [end_node];
        while (shortest_path[0] !== '') {
            shortest_path.unshift(prev[shortest_path[0]]);
        }
        shortest_path.shift();
        return shortest_path;
    }

    add_shortest_path(start_node, end_nodes) {
        /*
        Add the shortest path between two nodes.
         */
        for (const end_node of end_nodes) {
            if (end_node === start_node) {
                continue;
            }

            // only add the shortest path, if it is not already included in the visualisation
            let shortest_path = this.dijkstra(start_node, end_node);
            let add_path = false;

            if (start_node in this.shortest_paths) {
                if (!(end_node in this.shortest_paths[start_node])) {
                    let d = this.shortest_paths[start_node];
                    d[end_node] = shortest_path;
                    this.shortest_paths[start_node] = d;
                    add_path = true;
                }
            } else if (end_node in this.shortest_paths) {
                if (!(start_node in this.shortest_paths[end_node])) {
                    let d = this.shortest_paths[end_node];
                    d[start_node] = shortest_path;
                    this.shortest_paths[end_node] = d;
                    add_path = true;
                }
            } else {
                let d = {}
                d[end_node] = shortest_path;
                this.shortest_paths[start_node] = d;
                add_path = true;
            }

            if (add_path) {
                for (const node of this.nodes) {
                    if (shortest_path.includes(node['iri'])) {
                        this.vis_data.nodes.update(([node]))
                    }
                }
            }
        }
    }

    flatten_2d(d) {
        let flattened = [];
        for (let k1 in d) {

            for (let k2 in d[k1]) {
                flattened.push(...d[k1][k2])
            }
        }

        return flattened;
    }


    remove_shortest_path(start_node, end_nodes) {
        /*
        Add the shortest path between two nodes.
         */
        for (const end_node of end_nodes) {
            if (end_node === start_node) {
                continue;
            }
            if (start_node in this.shortest_paths) {
                if (end_node in this.shortest_paths[start_node]) {

                    let shortest_paths_old = JSON.parse(JSON.stringify(this.shortest_paths));

                    if (this.shortest_paths[start_node][end_node] !== undefined) {
                        delete this.shortest_paths[start_node][end_node];

                        for (const path_node of shortest_paths_old[start_node][end_node]) {
                            if (!this.still_included(path_node)) {
                                this.vis_data.nodes.remove(this.name_2_id[path_node]);
                            }
                        }
                    }
                }
            }
            if (end_node in this.shortest_paths) {
                if (start_node in this.shortest_paths[end_node]) {

                    let shortest_paths_old = JSON.parse(JSON.stringify(this.shortest_paths));

                    if (this.shortest_paths[end_node][start_node] !== undefined) {

                        delete this.shortest_paths[end_node][start_node];

                        for (const path_node of shortest_paths_old[end_node][start_node]) {
                            if (!this.still_included(path_node)) {
                                this.vis_data.nodes.remove(this.name_2_id[path_node]);
                            }
                        }
                    }
                }
            }
        }
    }

    add_node_to_vis(node_string) {
        for (const node of this.nodes) {
            let node_name = node["iri"];
            if (node_name === node_string) {
                this.vis_data.nodes.update(([node]))
            }
        }
    }

    get_search_results(search_string) {
        let search_string_lower = search_string.toLowerCase();
        let search_results = [];

        console.log('search for', search_string)
        for (const node of this.nodes) {
            let node_name = node["iri"];
            let node_name_lower = node_name.toLowerCase();

            if (node_name_lower.includes(search_string_lower)) {
                if (!this.center_nodes.includes(node_name)) {
                    search_results.push(node_name);
                }
            }
        }
        return (search_results);
    }

    add_center_node(node_string) {
        if (!this.center_nodes.includes(node_string)) {
            this.center_nodes.push(node_string);
            this.add_node_to_vis(node_string);
        }
    }

    remove_center_node(node_string) {
        if (this.center_nodes.includes(node_string)) {
            if (!(Object.values(this.hops).flat(1).includes(node_string))) {
                this.vis_data.nodes.remove(this.name_2_id[node_string]);
            }
            this.center_nodes = this.center_nodes.filter(function (f) {
                return f !== node_string
            })

        }
    }
}


