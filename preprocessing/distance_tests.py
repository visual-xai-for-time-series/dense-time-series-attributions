    
def main():
    
    from distance_functions import *


    dist_funcs = [
        ['Euclidean', euclidean, False],
        ['Normalized Euclidean', normalized_euclidean, False],
        ['Z-Normalized Euclidean', z_normalized_euclidean, False],
        ['Cosine', cosine, False],
        ['Pearson Correlation', pearson, True],
        ['Spearman Correlation', spearman, True],
        ['Bhattacharyya Distance', bhattacharyya_distance, True],
        ['Wasserstein Distance', wasserstein, False],
        ['Dynamic Time Warping Distance', dynamic_time_warping, False],
        ['Frechet Distance', frechet_dist, False],
    ]

    exclude = [
        'Frechet Distance',
        'Dynamic Time Warping Distance',
    ]

    
    import time

    a = dataset_test[0][0]
    b = dataset_test[1][0]

    for dist_fn in dist_funcs:
        dist_fn_name, dist_fn, _ = dist_fn
        start_time = time.process_time()
        r = dist_fn(a, b)
        end_time = time.process_time()
        rounded_time = np.round(end_time - start_time, 10)
        print(f'{dist_fn_name:40} Execution time: {rounded_time:12f} seconds - Results: {np.round(r, 10):12f}')


    data = X_test

    distances_path = os.path.join(results_path, f'{dataset.lower()}-distances.pkl')

    if os.path.exists(distances_path):
        with open(distances_path, 'rb') as file:
            distances_results = dill.load(file)
    else:
        distances_results = {}
        for dist_fn in dist_funcs:
            dist_fn_name, dist_fn, reverse = dist_fn
            if dist_fn_name in exclude:
                continue
        
            start_time = time.process_time()
            
            if len(data.shape) == 2:
                n, _ = data.shape
            else:
                n = len(data)
        
            dist = np.zeros((n, n), dtype=float)
            for i in range(n):
                for j in range(i, n):
                    dist[i, j] = dist_fn(data[i], data[j])
        
            end_time = time.process_time()
            rounded_time = np.round(end_time - start_time, 10)
            
            print(dist_fn_name)
            print(f'Index: Distance')
            nearest = np.argmin(dist[0,1:])
            if reverse:
                nearest = np.argmax(dist[0,1:])
            print(f'{nearest:5}: {dist[0,nearest]:.12f}')
            print(f'Time needed: {rounded_time:12f}')
            print()

            distances_results[dist_fn_name] = [rounded_time, dist, nearest, dist[0,nearest]]

        with open(distances_path, 'wb') as file:
            dill.dump(distances_results, file)

    for k in distances_results:
        rounded_time, dist, nearest, dist_to_nearest = distances_results[k]
        print(k)
        print(f'Index: Distance')
        print(f'{nearest:5}: {dist_to_nearest:.12f}')
        print(f'Time needed: {rounded_time:12f}')
        print()

