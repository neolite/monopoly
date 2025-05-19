const properties = [
  // Bottom row (from Go, moving left)
  {
    id: 1,
    name: 'Mediterranean Avenue',
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    group: 'brown',
    position: 1,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 3,
    name: 'Baltic Avenue',
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    group: 'brown',
    position: 3,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  
  // Left column (bottom to top)
  {
    id: 6,
    name: 'Oriental Avenue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    group: 'light-blue',
    position: 6,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 8,
    name: 'Vermont Avenue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    group: 'light-blue',
    position: 8,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 9,
    name: 'Connecticut Avenue',
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    group: 'light-blue',
    position: 9,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  
  // Top row (left to right)
  {
    id: 11,
    name: 'St. Charles Place',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    group: 'pink',
    position: 11,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 13,
    name: 'States Avenue',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    group: 'pink',
    position: 13,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 14,
    name: 'Virginia Avenue',
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    group: 'pink',
    position: 14,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  
  // Right column (top to bottom)
  {
    id: 16,
    name: 'St. James Place',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    group: 'orange',
    position: 16,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 18,
    name: 'Tennessee Avenue',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    group: 'orange',
    position: 18,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 19,
    name: 'New York Avenue',
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    group: 'orange',
    position: 19,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  
  // Bottom row (right to left)
  {
    id: 21,
    name: 'Kentucky Avenue',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    group: 'red',
    position: 21,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 23,
    name: 'Indiana Avenue',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    group: 'red',
    position: 23,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 24,
    name: 'Illinois Avenue',
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    group: 'red',
    position: 24,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  
  // Left column (bottom to top)
  {
    id: 26,
    name: 'Atlantic Avenue',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    group: 'yellow',
    position: 26,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 27,
    name: 'Ventnor Avenue',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    group: 'yellow',
    position: 27,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 29,
    name: 'Marvin Gardens',
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    group: 'yellow',
    position: 29,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  
  // Top row (left to right)
  {
    id: 31,
    name: 'Pacific Avenue',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    group: 'green',
    position: 31,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 32,
    name: 'North Carolina Avenue',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    group: 'green',
    position: 32,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 34,
    name: 'Pennsylvania Avenue',
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    group: 'green',
    position: 34,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  
  // Right column (top to bottom)
  {
    id: 37,
    name: 'Park Place',
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    group: 'dark-blue',
    position: 37,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 39,
    name: 'Boardwalk',
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    group: 'dark-blue',
    position: 39,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  
  // Railroads
  {
    id: 5,
    name: 'Reading Railroad',
    price: 200,
    rent: [25, 50, 100, 200],
    group: 'railroad',
    position: 5,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 15,
    name: 'Pennsylvania Railroad',
    price: 200,
    rent: [25, 50, 100, 200],
    group: 'railroad',
    position: 15,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 25,
    name: 'B&O Railroad',
    price: 200,
    rent: [25, 50, 100, 200],
    group: 'railroad',
    position: 25,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 35,
    name: 'Short Line',
    price: 200,
    rent: [25, 50, 100, 200],
    group: 'railroad',
    position: 35,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  
  // Utilities
  {
    id: 12,
    name: 'Electric Company',
    price: 150,
    rent: [4, 10],
    group: 'utility',
    position: 12,
    owner: null,
    houses: 0,
    mortgaged: false
  },
  {
    id: 28,
    name: 'Water Works',
    price: 150,
    rent: [4, 10],
    group: 'utility',
    position: 28,
    owner: null,
    houses: 0,
    mortgaged: false
  }
];

module.exports = {
  properties
};