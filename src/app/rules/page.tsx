import Link from 'next/link';

export default function Rules() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">Monopoly Game Rules</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-3">Objective</h2>
            <p className="text-gray-700">
              The objective of Monopoly is to become the wealthiest player through buying, renting, and selling property.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-3">Game Setup</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Each player starts with $1,500.</li>
              <li>Players take turns rolling dice and moving their tokens around the board.</li>
              <li>When a player lands on an unowned property, they can buy it from the bank.</li>
              <li>If they choose not to buy it, the property is auctioned to the highest bidder.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-3">Movement</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Roll two dice and move your token the sum of the dice in a clockwise direction.</li>
              <li>If you roll doubles, you get another turn after completing your move.</li>
              <li>If you roll doubles three times in a row, you go to Jail.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-3">Properties</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>When you land on an unowned property, you can buy it for the listed price.</li>
              <li>If you land on a property owned by another player, you must pay rent.</li>
              <li>Rent increases if the owner has all properties of the same color group.</li>
              <li>You can build houses and hotels on properties to increase rent.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-3">Special Spaces</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>GO:</strong> Collect $200 when you pass or land on GO.</li>
              <li><strong>Jail:</strong> Just visiting if you land on it. Go to Jail if sent there.</li>
              <li><strong>Free Parking:</strong> No action in the standard rules.</li>
              <li><strong>Go to Jail:</strong> Move directly to Jail without collecting $200.</li>
              <li><strong>Chance/Community Chest:</strong> Draw a card and follow its instructions.</li>
              <li><strong>Income Tax:</strong> Pay $200 to the bank.</li>
              <li><strong>Luxury Tax:</strong> Pay $100 to the bank.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-3">Jail</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You can get out of Jail by:
                <ul className="list-disc pl-6 mt-2">
                  <li>Paying a $50 fine at the start of your turn.</li>
                  <li>Using a "Get Out of Jail Free" card.</li>
                  <li>Rolling doubles on any of your next three turns.</li>
                </ul>
              </li>
              <li>If you don't roll doubles after three turns, you must pay $50 and move according to your roll.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-3">Bankruptcy</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>If you owe more money than you can pay, you are declared bankrupt.</li>
              <li>If you go bankrupt to another player, all your assets go to that player.</li>
              <li>If you go bankrupt to the bank, your properties are auctioned off.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-3">Winning</h2>
            <p className="text-gray-700">
              The game ends when all players except one have gone bankrupt. The remaining player is the winner.
            </p>
          </section>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
