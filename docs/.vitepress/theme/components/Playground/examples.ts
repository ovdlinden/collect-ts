export interface Example {
	name: string;
	category: string;
	code: string;
}

export const examples: Example[] = [
	{
		name: 'Hello Collection',
		category: 'Getting Started',
		code: `// Create a collection and chain methods
const result = collect([1, 2, 3, 4, 5])
  .map(n => n * 2)
  .filter(n => n > 4)
  .all();

result`,
	},
	{
		name: 'Working with Objects',
		category: 'Getting Started',
		code: `const users = [
  { name: 'Taylor', role: 'admin', active: true },
  { name: 'Abigail', role: 'user', active: true },
  { name: 'James', role: 'user', active: false },
];

// Filter active users and pluck names
collect(users)
  .where('active', true)
  .pluck('name')
  .all()`,
	},
	{
		name: 'Filter with Where',
		category: 'Filtering',
		code: `const products = [
  { name: 'Chair', price: 100, inStock: true },
  { name: 'Desk', price: 250, inStock: false },
  { name: 'Lamp', price: 50, inStock: true },
  { name: 'Monitor', price: 300, inStock: true },
];

// Find affordable products in stock
collect(products)
  .where('inStock', true)
  .where('price', '<', 200)
  .all()`,
	},
	{
		name: 'Group By',
		category: 'Grouping',
		code: `const orders = [
  { id: 1, status: 'completed', total: 100 },
  { id: 2, status: 'pending', total: 50 },
  { id: 3, status: 'completed', total: 200 },
  { id: 4, status: 'cancelled', total: 75 },
  { id: 5, status: 'pending', total: 150 },
];

// Group orders by status
const grouped = collect(orders).groupBy('status');

// Get totals per status
Object.fromEntries(
  Object.entries(grouped.all()).map(([status, items]) => [
    status,
    items.sum('total')
  ])
)`,
	},
	{
		name: 'Aggregations',
		category: 'Aggregating',
		code: `const scores = [
  { student: 'Alice', score: 85 },
  { student: 'Bob', score: 92 },
  { student: 'Charlie', score: 78 },
  { student: 'Diana', score: 95 },
];

const stats = {
  count: collect(scores).count(),
  sum: collect(scores).sum('score'),
  avg: collect(scores).avg('score'),
  min: collect(scores).min('score'),
  max: collect(scores).max('score'),
};

stats`,
	},
	{
		name: 'Sort and Take',
		category: 'Sorting',
		code: `const articles = [
  { title: 'Vue 3 Guide', views: 1500 },
  { title: 'React Hooks', views: 2300 },
  { title: 'TypeScript Tips', views: 1800 },
  { title: 'CSS Grid', views: 900 },
  { title: 'Node.js Best Practices', views: 3100 },
];

// Get top 3 most viewed articles
collect(articles)
  .sortByDesc('views')
  .take(3)
  .pluck('title')
  .all()`,
	},
	{
		name: 'Unique Values',
		category: 'Filtering',
		code: `const tags = [
  { post: 'Post 1', tag: 'javascript' },
  { post: 'Post 2', tag: 'typescript' },
  { post: 'Post 3', tag: 'javascript' },
  { post: 'Post 4', tag: 'vue' },
  { post: 'Post 5', tag: 'typescript' },
];

// Get unique tags
collect(tags)
  .pluck('tag')
  .unique()
  .values()
  .all()`,
	},
	{
		name: 'Partition',
		category: 'Filtering',
		code: `const tasks = [
  { title: 'Write docs', done: true },
  { title: 'Fix bug', done: false },
  { title: 'Review PR', done: true },
  { title: 'Deploy', done: false },
];

// Split into completed and pending
const [completed, pending] = collect(tasks)
  .partition(task => task.done)
  .map(c => c.pluck('title').all())
  .all();

{ completed, pending }`,
	},
	{
		name: 'Reduce',
		category: 'Aggregating',
		code: `const cart = [
  { product: 'Shirt', price: 25, qty: 2 },
  { product: 'Pants', price: 50, qty: 1 },
  { product: 'Shoes', price: 80, qty: 1 },
];

// Calculate cart total
const total = collect(cart)
  .reduce((sum, item) => sum + (item.price * item.qty), 0);

// Or using sum with callback
const total2 = collect(cart)
  .sum(item => item.price * item.qty);

{ total, total2 }`,
	},
	{
		name: 'Flatten Nested Data',
		category: 'Transforming',
		code: `const departments = [
  {
    name: 'Engineering',
    teams: [
      { name: 'Frontend', members: 5 },
      { name: 'Backend', members: 8 },
    ]
  },
  {
    name: 'Design',
    teams: [
      { name: 'UX', members: 3 },
      { name: 'Visual', members: 4 },
    ]
  },
];

// Get all team names
collect(departments)
  .pluck('teams')
  .flatten()
  .pluck('name')
  .all()`,
	},
];

export const defaultCode = examples[0].code;

export function getExamplesByCategory(): Map<string, Example[]> {
	const map = new Map<string, Example[]>();
	for (const example of examples) {
		const list = map.get(example.category) || [];
		list.push(example);
		map.set(example.category, list);
	}
	return map;
}
