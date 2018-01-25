import numpy as np

class CEqualizer:

    """
        _weighted: bool
            If True, uses density-weighted cluster means.
        _verbose: bool
            If True, prints report after each iteration.
        _maxiter: int
            Maximum number of iterations to perform.
        _cutoff: float
            When the algorithm is complete, the total cluster densities should be more-or-less equal. If the ratio of the standard deviation of the cluster densities to the mean cluster density is below _cutoff, the result is considered a success.
        _attempts: int
            If the result of the algorithm was a failure (doesn't meet the cutoff threshold), the entire process is reinitialized up to _attempts - 1 times.
    """
    def __init__(self, _weighted, _verbose, _maxiter, _cutoff, _attempts):
        self.weighted = _weighted
        self.verbose = _verbose
        self.maxiter = _maxiter
        self.cutoff = _cutoff
        self.attempts = _attempts

    """
        The only function other than initialization that needs to be called during usage.
        Inputs:
            objects: m x n numpy array
                Objects to cluster (m objects in R_n space)
            densities: m x 1 numpy array
                Density of each object
            n_clusters: int
                Desired number of clusters
        Returns:
            labels: m x 1 numpy array (int)
                Cluster assignment for each object
            means: n_clusters x n numpy array
            c_densities: n_clusters x 1 numpy array
                Total density of each cluster
            nearest: n_clusters x 1 numpy array (int)
                For each cluster, index of member object closest to the mean
    """
    def fit(self, objects, densities, n_clusters):
        for i in range(self.attempts):
            labels, means = self.initialize_clusters(objects, densities, n_clusters)
            means, c_densities, nearest, success = self.equalize(objects, densities, labels)
            if success:
                break
            else:
                print("Reinitializing...")
        return labels, means, c_densities, nearest

    def initialize_clusters(self, objects, densities, n_clusters):
        print("Initialize clusters")
        rows = np.random.randint(objects.shape[0], size=n_clusters)
        cluster_means = objects[rows,:]
        labels = np.full(objects.shape[0], -1)
        for i in range(objects.shape[0]):
            if i%1000 == 0:
                print(i)
            obj = objects[i]
            dist = [self.distance(obj, meani) for meani in cluster_means]
            labels[i] = np.argmin(dist)
        w_means = self.weighted_means(objects, densities, labels)
        return labels, w_means

    def equalize(self, objects, densities, labels):
        success = False
        cluster_means = self.weighted_means(objects, densities, labels)
        cluster_densities = self.cluster_densities(densities, labels)
        cl, counts = np.unique(labels, return_counts=True)
        last_stddev = [0, 0]
        print("mean: ", np.mean(cluster_densities))
        for i in range(self.maxiter):
            self.push_max(objects, densities, labels, cluster_means, cluster_densities, counts)
            self.pull_min(objects, densities, labels, cluster_means, cluster_densities, counts)
            stddev = np.std(cluster_densities)
            if i%20 == 0:
                print(i)
                print("stddev: ", stddev)
            if last_stddev.count(stddev) > 3:
                print("Converged")
                break
            last_stddev.append(stddev)
        print("Finished last iteration")
        print("mean: ", np.mean(cluster_densities))
        print("stddev: ", np.std(cluster_densities))
        if np.std(cluster_densities)/np.mean(cluster_densities) <= self.cutoff:
            print("Success - reached cutoff")
            success = True

        # For each cluster, find the member object nearest to the mean
        nearest = np.full(cluster_means.shape[0], -1)
        for i in range(cluster_means.shape[0]):
            mean = cluster_means[i]
            clobj = np.argwhere(labels == i)
            dist = [self.distance(objects[obj], mean) for obj in clobj]
            nearest[i] = clobj[np.argmin(dist)]

        return cluster_means, cluster_densities, nearest, success

    def weighted_means(self, objects, densities, labels):
        w_means = np.zeros((np.amax(labels)+1, objects.shape[1]))
        for cl in np.unique(labels):
            clobj = objects[labels == cl]
            cld = densities[labels == cl]
            w_means[cl] = np.sum(clobj*cld[:,np.newaxis], axis=0) / np.sum(cld)
        return w_means

    def cluster_densities(self, densities, labels):
        cl_densities = np.zeros(np.amax(labels)+1)
        for cl in np.unique(labels):
            cl_densities[cl] = np.sum(densities[labels == cl])
        return cl_densities

    def distance(self, x1, x2):
        diff = x1 - x2
        return np.sqrt(np.inner(diff, diff))

    def distance_sq(self, x1, x2):
        diff = x1 - x2
        return np.inner(diff, diff)

    def move_object(self, obj, objects, densities, origin, destination, labels, c_means, c_densities, counts):
        if self.verbose:
            print("********")
            print("Moving object")
            print("object: ", obj)
            print("origin: ", origin)
            print("destination: ", destination)
            print()

        #Push the object to its new destination
        obj_loc = objects[obj]
        density = densities[obj]

        originsum = c_densities[origin] * c_means[origin]
        c_densities[origin] = c_densities[origin] - density
        newsum = originsum - (obj_loc*density)
        c_means[origin] = newsum / c_densities[origin]

        destsum = c_densities[destination] * c_means[destination]
        c_densities[destination] = c_densities[destination] + density
        newsum = destsum + (obj_loc*density)
        c_means[destination] = newsum / c_densities[destination]

        labels[obj] = destination

        return

    def push_max(self, objects, densities, labels, c_means, c_densities, counts):
        if self.verbose:
            print("************************")
            print("Pushing from max")
            print()
        visited = []

        clmaxd = np.argmax(c_densities)
        clobj = np.argwhere(labels == clmaxd)

        visited.append(clmaxd)

        min_distances = np.zeros(clobj.shape[0])
        nearest_cluster = np.zeros(clobj.shape[0]).astype(int)

        for i in range(clobj.shape[0]):
            obj = objects[clobj[i]]
            distances = [self.distance(obj, mean) for mean in c_means]
            distances[clmaxd] = float('Inf')

            #print(distances)
            min_distances[i] = np.amin(distances)
            nearest_cluster[i] = np.argmin(distances)

        #print(min_distances)
        #print(nearest_cluster)

        obj_to_push = clobj[np.argmin(min_distances)]
        destination = nearest_cluster[np.argmin(min_distances)]

        self.move_object(obj_to_push, objects, densities, clmaxd, destination, labels, c_means, c_densities, counts)

        self.push(destination, clmaxd, objects, densities, labels, c_means, c_densities, counts, visited)

        return

    def push(self, cluster, parent, objects, densities, labels, c_means, c_densities, counts, visited):
        d_cluster = c_densities[cluster]
        mean_cluster = c_means[cluster]
        pot_dest = np.argwhere(c_densities < d_cluster)
        pot_dest = np.delete(pot_dest, np.argwhere(pot_dest == parent))

        dist = [self.distance(mean_cluster, c_means[i]) for i in pot_dest]
        if not dist:
            return

        destination = pot_dest[np.argmin(dist)]
        mean_dest = c_means[destination]
        if destination in visited:
            return
        visited.append(destination)

        clobj = np.argwhere(labels == cluster)
        dist = [self.distance(objects[i], mean_dest) for i in clobj]

        obj_to_push = clobj[np.argmin(dist)]
        location = objects[obj_to_push]

        #dist_to_dest = np.amin(dist)
        dist_to_dest = self.distance(mean_cluster, mean_dest)

        #print("orig., dest.: ", cluster, destination)

        for i in range(c_means.shape[0]):
            #print(i)
            if i == cluster or i == destination:
                #print("continuing ", i)
                continue
            mean = c_means[i]
            if self.distance(mean, mean_cluster) < dist_to_dest and self.distance(mean, mean_dest) < dist_to_dest:
                #print("returning")
                return

        self.move_object(obj_to_push, objects, densities, cluster, destination, labels, c_means, c_densities, counts)

        self.push(destination, cluster, objects, densities, labels, c_means, c_densities, counts, visited)

        return

    def pull_min(self, objects, densities, labels, c_means, c_densities, counts):
        if self.verbose:
            print("************************")
            print("Pulling to min")
            print()
        visited = []

        clmind_A = np.argmin(c_densities)
        mean_A = c_means[clmind_A]
        clobj_notA = np.argwhere(labels != clmind_A)

        visited.append(clmind_A)

        dist = [self.distance(objects[i], mean_A) for i in clobj_notA]
        if not dist:
            return
        
        obj_to_pull = clobj_notA[np.argmin(dist)]
        to_pull_from = labels[obj_to_pull]

        self.move_object(obj_to_pull, objects, densities, to_pull_from, clmind_A, labels, c_means, c_densities, counts)

        self.pull(to_pull_from, clmind_A, objects, densities, labels, c_means, c_densities, counts, visited)

        return

    def pull(self, cluster, parent, objects, densities, labels, c_means, c_densities, counts, visited):
        visited.append(cluster)
        d_cluster = c_densities[cluster]
        mean_cluster = c_means[cluster]
        pot_orig = np.argwhere(c_densities > d_cluster)
        pot_orig = np.delete(pot_orig, np.argwhere(pot_orig == parent))

        dist = [self.distance(mean_cluster, c_means[i]) for i in pot_orig]
        if not dist:
            return

        origin = pot_orig[np.argmin(dist)]
        mean_orig = c_means[origin]
        if origin in visited:
            return

        orig_obj = np.argwhere(labels == origin)
        dist = [self.distance(objects[i], mean_cluster) for i in orig_obj]
        dist2 = [self.distance(objects[i], mean_orig) for i in orig_obj]
        score = np.divide(dist, dist2)

        obj_to_pull = orig_obj[np.argmin(score)]
        location = objects[obj_to_pull]

        #dist_to_dest = np.amin(dist)
        dist_to_dest = self.distance(mean_cluster, mean_orig)

        #print("orig., dest.: ", cluster, destination)

        for i in range(c_means.shape[0]):
            #print(i)
            if i == cluster or i == origin:
                #print("continuing ", i)
                continue
            mean = c_means[i]
            if self.distance(mean, origin) < dist_to_dest and self.distance(mean, mean_cluster) < dist_to_dest:
                #print("returning")
                return

        self.move_object(obj_to_pull, objects, densities, origin, cluster, labels, c_means, c_densities, counts)

        self.pull(origin, cluster, objects, densities, labels, c_means, c_densities, counts, visited)

        return
