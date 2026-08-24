import { mapNodesToParents, optimize } from 'svgo';

optimize('<svg />');
mapNodesToParents({ type: 'root', children: [] });
