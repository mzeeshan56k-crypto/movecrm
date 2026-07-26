// Topical cluster 2: solution and feature pages (transactional intent).
// Answer-first structure, question headings, self-contained chunks, FAQs for
// AI answer engines. No emojis, no em dashes, short sentences for readability.

const AUTHOR = 'Movers CRM Team';

export const SOLUTION_POSTS = [
  {
    slug: 'moving-company-dispatch-software',
    title: 'Moving Company Dispatch Software: What It Does',
    description: 'Moving company dispatch software assigns crews and trucks, prevents double bookings and keeps every job on schedule. See how it works in Movers CRM.',
    date: '2026-07-23',
    updated: '2026-07-23',
    read: 6,
    author: AUTHOR,
    keyword: 'moving company dispatch software',
    tldr: 'Moving company dispatch software assigns crews and trucks to booked jobs on a single day board. It shows real time availability so you never promise a team you do not have. Movers CRM includes dispatch with crew records, truck capacity and job assignments on every plan.',
    body: `
<h2>What is moving company dispatch software?</h2>
<p>Moving company dispatch software is the tool that turns booked jobs into staffed jobs. It shows every move scheduled for a given day, which crew is assigned, which truck is going out, and whether anyone is still unassigned. Dispatch software replaces the whiteboard, the group text and the spreadsheet that most movers outgrow.</p>
<p>The core job is simple. Prevent double bookings, make sure every truck has a crew, and give the office one screen that answers the question everyone asks on a Friday afternoon: are we covered for tomorrow?</p>

<h2>Why do moving companies need dispatch software?</h2>
<p>Because manual dispatch fails at scale. One or two moves a day fits on a whiteboard. Six moves a day across four trucks with part time helpers does not. Mistakes become expensive fast, and they always happen on your busiest weekend.</p>
<p>The three failures that cost real money are double booking a foreman, sending a truck too small for the load, and forgetting to confirm a helper who then does not show. Each one either delays a job or forces you to refund a frustrated customer. Software prevents all three by showing availability before you assign.</p>

<h2>How does a dispatch board work?</h2>
<p>A dispatch board lists every job for a chosen day, with its arrival window, address, crew and truck. You drag or select people onto the job, and the board updates instantly. Anyone already assigned elsewhere shows as unavailable, so you cannot book them twice.</p>
<p>In Movers CRM the board pulls from live records rather than a static list. Crew members carry a role such as foreman, driver or mover. Trucks carry a capacity in cubic feet and a status such as available or in maintenance. When a truck goes down for repair, it disappears from the assignable pool automatically.</p>

<h2>What should dispatch software include?</h2>
<ul>
<li><strong>Day view of every job</strong> with arrival windows and job status</li>
<li><strong>Crew records</strong> with roles and wage rates for job costing</li>
<li><strong>Truck records</strong> with capacity and maintenance status</li>
<li><strong>Real time availability</strong> so double bookings are impossible</li>
<li><strong>Crew notes</strong> that reach the team before they arrive</li>
<li><strong>Links to the job record</strong> so dispatch sees the estimate and inventory</li>
</ul>
<p>That last point matters more than people expect. A dispatcher who can see the estimate knows the move includes a piano before the crew arrives without the right equipment.</p>

<h2>How does dispatch connect to the rest of the business?</h2>
<p>Dispatch is the middle of a chain, not an island. A lead becomes an estimate. An accepted estimate becomes a booked job. A booked job needs a crew and a truck. A completed job becomes an invoice and a review request.</p>
<p>When dispatch lives in a separate tool, someone re typed the job into it. That is where addresses get mistyped and move dates slip by a day. Keeping dispatch inside the same system as <a href="/blog/moving-company-estimating-software">the estimate that created the job</a> removes the re entry step and the errors that come with it.</p>

<h2>How do you know your dispatch is costing you money?</h2>
<p>Look for these signs over the last three months. Any two of them mean your process is the bottleneck, not your team.</p>
<ol>
<li>You have double booked a crew member at least once</li>
<li>A crew arrived without equipment the job clearly needed</li>
<li>You cannot tell who worked which job last month without asking</li>
<li>Confirming Saturday takes more than a few minutes</li>
<li>A truck sat idle while you turned down a job</li>
</ol>
<p>Idle trucks are the expensive one. If you turned work away while a vehicle sat in the yard, the problem is visibility, not capacity.</p>

<h2>How do you handle last minute changes?</h2>
<p>Handle them by keeping one source of truth that everyone checks. Same day changes are normal in moving, so the goal is not preventing them. The goal is making sure a change reaches the crew before they drive to the wrong address.</p>
<p>Three situations cause most of the chaos: a customer moves their date, a crew member calls in sick, and a job runs long and delays the afternoon move. Each one requires reassigning people who may already be committed elsewhere.</p>
<p>A live board handles all three the same way. You open the day, see who is free, and reassign. Because availability updates as you go, you cannot accidentally move someone onto a job they are already booked for. Crew notes on the job record carry the change details, so the foreman sees the new access instructions rather than hearing them second hand.</p>

<h2>What does dispatch look like in Movers CRM?</h2>
<p>Movers CRM includes a dispatch day board on every plan. It shows each scheduled move with its crew and truck assignments and flags anything unstaffed. Crew and truck records live in the same workspace, so availability is always current.</p>
<p>Because dispatch sits alongside the pipeline, estimating and invoicing, a job flows from first call to final payment without leaving the app. You can review <a href="/blog/moving-company-software-features">the full set of features that book more moves</a> or <a href="/">see how Movers CRM fits your operation</a>.</p>
`,
    faqs: [
      { q: 'What is dispatch software for moving companies?', a: 'It is software that assigns crews and trucks to booked moves and shows them on one day board. It prevents double bookings by displaying real time availability before you assign anyone.' },
      { q: 'Can I run dispatch on a spreadsheet?', a: 'You can up to about two moves a day. Beyond that, spreadsheets do not show live availability, so double bookings and unstaffed jobs start happening on your busiest weekends.' },
      { q: 'Does dispatch software track truck capacity?', a: 'Good dispatch software does. Movers CRM stores each truck with its capacity in cubic feet and a status, so vehicles in maintenance are removed from the assignable pool automatically.' },
      { q: 'Should dispatch be separate from my CRM?', a: 'No. Separate tools force someone to re enter each job, which is where wrong addresses and shifted dates come from. Dispatch works best inside the same system that created the estimate.' },
      { q: 'How much does moving dispatch software cost?', a: 'Dispatch is usually bundled into moving company software that runs between 99 and 399 dollars per month. In Movers CRM it is included on every plan rather than sold as an add on.' },
    ],
  },

  {
    slug: 'moving-company-estimating-software',
    title: 'Moving Company Estimating Software: Quote Faster',
    description: 'Moving company estimating software builds accurate line item quotes in minutes from your own tariff. See how faster quoting wins more booked moves.',
    date: '2026-07-23',
    updated: '2026-07-23',
    read: 6,
    author: AUTHOR,
    keyword: 'moving company estimating software',
    tldr: 'Moving company estimating software builds line item quotes from your own rates and totals them instantly. Speed is the point, because the mover who sends an accurate quote first usually books the job. Movers CRM includes estimating that converts straight into a job and an invoice.',
    body: `
<h2>What is moving company estimating software?</h2>
<p>Moving company estimating software builds a priced quote for a move using your own rate card. You pick the services, enter hours or quantities, and the system totals it. The finished estimate can be sent to the customer and then converted into a booked job without retyping anything.</p>
<p>It replaces the mental math and the paper rate sheet. More importantly, it makes every quote consistent, so two salespeople quoting the same move produce the same price.</p>

<h2>Why does quoting speed decide who wins the job?</h2>
<p>Because moving customers contact several companies at once and often book the first one that gives them a real number. Industry coverage in 2026 repeats the same finding: the mover who confirms faster wins, and price is not always the deciding factor.</p>
<p>A customer calling on Tuesday for a Saturday move is not shopping for weeks. They want certainty. If you quote in five minutes and your competitor calls back tomorrow, you have already won unless your price is far off.</p>

<h2>How does line item estimating work?</h2>
<p>A line item estimate breaks the move into billable parts. Each line has a rate type, a quantity and a rate, and the software multiplies and totals them.</p>
<div class="blog-table-wrap">
<table class="blog-table">
<thead><tr><th>Line item</th><th>Rate type</th><th>Example</th></tr></thead>
<tbody>
<tr><td>Moving labor</td><td>Hourly per crew</td><td>6 hours at your crew rate</td></tr>
<tr><td>Travel fee</td><td>Flat</td><td>One fixed charge</td></tr>
<tr><td>Packing service</td><td>Hourly</td><td>4 hours of packing</td></tr>
<tr><td>Packing materials</td><td>Per unit</td><td>30 boxes</td></tr>
<tr><td>Specialty item</td><td>Flat</td><td>Piano handling</td></tr>
<tr><td>Long distance</td><td>Per mile</td><td>Mileage between cities</td></tr>
</tbody>
</table>
</div>
<p>Because the rates live in a configurable tariff, you change a price once and every future quote uses it. No one is working from an old printout.</p>

<h2>What makes an estimate accurate?</h2>
<p>Accuracy comes from capturing the right details before you price. Four inputs drive most of the number: move size, distance, access and services.</p>
<ul>
<li><strong>Move size</strong> in bedrooms or cubic feet sets the crew and hours</li>
<li><strong>Distance</strong> separates a local hourly job from a long distance mileage job</li>
<li><strong>Access</strong> covers stairs, elevators and long carries that add real time</li>
<li><strong>Services</strong> such as packing, storage or specialty items add lines</li>
</ul>
<p>Missing access details is the classic estimating mistake. A third floor walk up with no elevator can add hours that were never quoted, which turns a profitable job into a break even one.</p>

<h2>Why should every quote come off one tariff?</h2>
<p>Because inconsistent pricing costs you money in both directions. When each salesperson prices from memory, one quotes too high and loses winnable jobs, while another quotes too low and books work that barely covers wages.</p>
<p>A single configurable tariff fixes this. Your rates live in one place, every quote pulls from them, and a price change applies everywhere at once. When fuel costs rise or you raise your hourly crew rate, you update one number instead of hoping five people remember.</p>
<p>It also makes your margins measurable. If every job is priced from the same rate card, you can compare quoted value against actual hours worked and see which job types genuinely make money. Companies pricing from memory cannot run that comparison, because there is no consistent baseline to measure against.</p>

<h2>Should you quote on the phone or do a survey?</h2>
<p>Quote on the phone for small local moves and survey for large or complex ones. A studio or one bedroom apartment can be priced accurately from a short call. A four bedroom house with a garage, a piano and a storage leg deserves a visual survey, whether in person or by video.</p>
<p>The practical rule is value based. If getting it wrong by two hours would erase your margin, look at the home first. If it would not, quote immediately and win the speed advantage.</p>

<h2>How do you present a quote so it gets accepted?</h2>
<p>Present the quote as a clear breakdown rather than a single number. A customer looking at one total has nothing to judge except price, so they compare you only on that. A breakdown shows what they are buying.</p>
<p>Send it the same day, itemised, with the crew size and estimated hours visible. Explain what would change the price, such as extra stairs or additional boxes, so there are no surprises later. Then confirm the next step plainly by asking whether they want to hold the date.</p>
<p>Quotes that sit without a follow up date are where most bookings quietly disappear. Set a reminder before you move to the next call, because the customer who did not answer today often books with whoever contacts them on Thursday.</p>

<h2>How does estimating connect to the rest of the job?</h2>
<p>An estimate should not be a dead end document. In Movers CRM an accepted estimate becomes a booked job on the pipeline, that job flows to <a href="/blog/moving-company-dispatch-software">the dispatch board for crew and truck assignment</a>, and the same line items generate the invoice when the move is done.</p>
<p>That chain removes three re entry points. Fewer re entries means fewer wrong totals, fewer missed charges and faster billing after the truck comes back. To see the whole flow in one place, <a href="/">review what Movers CRM covers</a>.</p>
`,
    faqs: [
      { q: 'What is estimating software for movers?', a: 'It is software that builds a priced quote from your own rate card, using line items for labor, travel, packing and specialty services. The totals calculate automatically so quotes stay consistent across your team.' },
      { q: 'How fast should a moving quote go out?', a: 'Aim for minutes, not days, on standard local moves. Customers typically contact several movers at once and often book whoever gives them a real number first.' },
      { q: 'Can estimating software handle long distance moves?', a: 'Yes. Long distance pricing usually uses a per mile line item alongside labor and materials, so the same estimate covers both local hourly work and mileage based jobs.' },
      { q: 'Does an estimate become an invoice automatically?', a: 'In Movers CRM it does. The accepted estimate converts into a booked job, and the same line items generate the invoice after the move, so nothing is retyped.' },
      { q: 'What is the most common estimating mistake?', a: 'Skipping access details. Stairs, elevators and long carries add real hours, and leaving them out turns a profitable quote into a break even job.' },
    ],
  },

  {
    slug: 'moving-company-invoicing-software',
    title: 'Moving Company Invoicing Software: Get Paid Faster',
    description: 'Moving company invoicing software turns estimates into invoices, records payments and tracks balances so movers get paid faster with less chasing.',
    date: '2026-07-23',
    updated: '2026-07-23',
    read: 6,
    author: AUTHOR,
    keyword: 'moving company invoicing software',
    tldr: 'Moving company invoicing software turns a completed job into an invoice, records card, cash, check and ACH payments, and tracks what is still owed. It shortens the gap between finishing a move and getting paid. Movers CRM includes invoicing and payment tracking on every plan.',
    body: `
<h2>What is moving company invoicing software?</h2>
<p>Moving company invoicing software creates and tracks the bills for completed moves. It pulls the priced line items from the job, applies tax and any discount, produces the invoice, and then records payments against it until the balance reaches zero.</p>
<p>The difference from generic accounting software is the starting point. Moving invoicing begins with the estimate you already built, so the charges match what the customer agreed to.</p>

<h2>Why do moving companies struggle to get paid on time?</h2>
<p>Because billing usually happens after the busy part of the day is over. The crew returns, paperwork piles up, and invoicing waits until someone has a quiet hour. That delay is where cash flow leaks.</p>
<p>Three problems repeat across the industry. Invoices go out days after the move, so the job is no longer fresh in the customer's mind. Deposits are recorded in one place and final payments in another, so nobody is sure what is outstanding. And partial payments get forgotten entirely.</p>

<h2>How does invoicing work inside a moving CRM?</h2>
<p>Invoicing works best when the invoice is generated from the job rather than created from scratch. The flow runs in four steps.</p>
<ol>
<li>The move is completed and marked done on the job record</li>
<li>The estimate line items carry over into an invoice, with tax applied</li>
<li>Payments are recorded as they arrive, by card, cash, check or ACH</li>
<li>The invoice status updates itself to partial or paid as the balance changes</li>
</ol>
<p>Automatic status is the part that saves arguments. When a customer paid a deposit and then half the balance, the invoice shows partial with an exact figure. No one has to reconstruct it from memory.</p>

<h2>What payment methods should the software support?</h2>
<div class="blog-table-wrap">
<table class="blog-table">
<thead><tr><th>Method</th><th>When movers use it</th></tr></thead>
<tbody>
<tr><td>Card</td><td>Deposits and most residential final payments</td></tr>
<tr><td>Cash</td><td>Local jobs settled on site</td></tr>
<tr><td>Check</td><td>Commercial and office moves</td></tr>
<tr><td>ACH or bank transfer</td><td>Larger commercial invoices and repeat accounts</td></tr>
</tbody>
</table>
</div>
<p>Recording all four in the same place is what makes your outstanding balance figure trustworthy. If cash gets written in a notebook, your reporting is wrong the moment the notebook is out of date.</p>

<h2>What should a moving invoice include?</h2>
<p>A moving invoice should show the customer exactly what they agreed to and what remains owed. Anything missing from that list invites a phone call.</p>
<ul>
<li><strong>Invoice number and date</strong> so both sides can reference it</li>
<li><strong>Job details</strong> including move date and both addresses</li>
<li><strong>Line items</strong> matching the approved estimate, priced individually</li>
<li><strong>Tax</strong> applied at your configured rate</li>
<li><strong>Any discount</strong> shown as its own line rather than hidden in a total</li>
<li><strong>Payments received</strong> including the booking deposit</li>
<li><strong>Balance due</strong> stated clearly with a due date</li>
</ul>
<p>Showing payments already received is the detail movers skip most often. A customer who paid a 300 dollar deposit and then sees the full total without it deducted will call, and that call costs you more time than the line would have.</p>

<h2>How do you reduce unpaid balances?</h2>
<p>Take a deposit at booking, invoice the day the move completes, and follow up on anything outstanding within a week. Those three habits solve most collection problems without difficult conversations.</p>
<ul>
<li><strong>Deposit at booking</strong> confirms commitment and covers your scheduling risk</li>
<li><strong>Same day invoicing</strong> reaches the customer while the move is fresh</li>
<li><strong>Weekly balance review</strong> catches partial payments before they age</li>
<li><strong>Clear line items</strong> reduce disputes, since charges match the signed estimate</li>
</ul>
<p>Disputes usually trace back to a charge the customer does not recognise. When the invoice mirrors the estimate they approved, that conversation rarely starts.</p>

<h2>How do you handle a customer who disputes a charge?</h2>
<p>Start by comparing the invoice against the signed estimate, because most disputes come from a charge that was never quoted. If the extra work was genuine, explain what changed on the day and why it added time.</p>
<p>Common triggers are predictable. The job ran longer than estimated, packing materials were used beyond the quote, or access was worse than described during the call. Each of these is defensible when your crew recorded it at the time and indefensible when it appears only on the bill.</p>
<p>Keeping notes on the job record protects you here. A dated note saying the elevator was out of service turns an argument into an explanation. Settle small differences quickly rather than defending every dollar, since a short dispute that ends well often still produces a positive review.</p>

<h2>How does invoicing fit the rest of your workflow?</h2>
<p>Invoicing is the last link in a chain that starts with a lead. The lead becomes an estimate, the estimate becomes a booked job, the job gets crewed on the dispatch board, and the completed job becomes an invoice.</p>
<p>When those steps live in one system, cash collected appears on the same dashboard as booked value and lead sources. That lets you see whether a marketing channel produces jobs that actually pay, which is the point of <a href="/blog/moving-company-lead-management-guide">tracking leads from first contact to final payment</a>. Movers CRM keeps that chain intact, and you can <a href="/">see how the workflow runs end to end</a>.</p>
`,
    faqs: [
      { q: 'What is invoicing software for moving companies?', a: 'It creates invoices from completed moves using the line items already priced on the estimate, then records payments and tracks the remaining balance until the invoice is paid.' },
      { q: 'Can I take a deposit before the move?', a: 'Yes. Record the deposit against the invoice at booking, and the balance updates automatically. The invoice then shows as partial until the final payment is recorded.' },
      { q: 'Which payment methods should I be able to record?', a: 'Card, cash, check and ACH cover nearly all moving work. Recording every method in the same system is what keeps your outstanding balance figure accurate.' },
      { q: 'How quickly should I invoice after a move?', a: 'Same day is best. The job is fresh for the customer, the details are clear, and payment tends to arrive faster than when invoices go out days later.' },
      { q: 'Do I still need accounting software?', a: 'Usually yes. Moving CRM invoicing handles job billing and payment tracking, while your accountant or accounting package handles taxes, payroll and financial statements.' },
    ],
  },

  {
    slug: 'crm-for-long-distance-movers',
    title: 'CRM for Long Distance Movers: What to Look For',
    description: 'A CRM for long distance movers must handle mileage pricing, multi day schedules and longer sales cycles. See what to look for and how Movers CRM helps.',
    date: '2026-07-23',
    updated: '2026-07-23',
    read: 6,
    author: AUTHOR,
    keyword: 'CRM for long distance movers',
    tldr: 'A CRM for long distance movers needs mileage based pricing, longer follow up cycles and multi day job scheduling. Long distance leads book weeks ahead, so follow up discipline decides who wins. Movers CRM handles local and long distance jobs in the same pipeline.',
    body: `
<h2>How is long distance moving different from local moving?</h2>
<p>Long distance moving differs in three ways that change what your software must do: pricing, timeline and follow up. Local moves usually price by the hour and book within days. Long distance moves price by distance and weight or volume, and customers often plan them weeks or months ahead.</p>
<p>That longer runway is an advantage and a risk. You have time to build trust, but you also have more chances to lose the customer to a competitor who followed up more consistently.</p>

<h2>What should a CRM for long distance movers include?</h2>
<ul>
<li><strong>Mileage based pricing</strong> as a line item alongside labor and materials</li>
<li><strong>Job type separation</strong> so long distance work reports separately from local</li>
<li><strong>Long follow up cycles</strong> with tasks and reminders over weeks</li>
<li><strong>Multi day scheduling</strong> for load, transit and delivery</li>
<li><strong>Inventory records</strong> for what is being shipped</li>
<li><strong>Lead source reporting</strong> since long distance leads cost more to acquire</li>
</ul>
<p>The last point is easy to overlook. Long distance leads are usually more expensive than local ones, so knowing which channel produces booked interstate jobs directly protects your marketing budget.</p>

<h2>How do you price a long distance move?</h2>
<p>Long distance pricing normally combines a mileage charge with labor and materials. A common structure uses a per mile rate for the transit leg, hourly labor for loading and unloading, and per unit charges for packing materials.</p>
<div class="blog-table-wrap">
<table class="blog-table">
<thead><tr><th>Component</th><th>How it is charged</th></tr></thead>
<tbody>
<tr><td>Transit</td><td>Per mile between origin and destination</td></tr>
<tr><td>Loading and unloading</td><td>Hourly labor at each end</td></tr>
<tr><td>Packing materials</td><td>Per unit, such as per box</td></tr>
<tr><td>Specialty handling</td><td>Flat fee per item</td></tr>
<tr><td>Storage in transit</td><td>Flat monthly or per period</td></tr>
</tbody>
</table>
</div>
<p>Because these quotes run larger than local jobs, accuracy matters more. A ten percent estimating error on a small apartment move is annoying. The same error on an interstate move can wipe out the profit on the job.</p>

<h2>Why does follow up decide long distance bookings?</h2>
<p>Because the customer is not ready to commit on the first call. Someone relocating for a job in three months is gathering options, not booking today. The mover who is still politely present when they are ready is the one who gets the booking.</p>
<p>This is where most long distance leads are lost. The quote goes out, nobody sets a reminder, and six weeks later the customer books elsewhere. A CRM that keeps the lead visible on the pipeline with a dated follow up task prevents that silent loss. The same discipline applies to every channel, which is why <a href="/blog/moving-company-lead-management-guide">a defined lead process</a> matters more for long distance than for local work.</p>

<h2>How do you schedule a multi day interstate job?</h2>
<p>Treat the move as one job with several phases rather than separate bookings. Load day needs a crew and a truck at origin. Transit needs a driver. Delivery needs a crew at destination, sometimes days later.</p>
<p>Keep all phases attached to one job record so the estimate, inventory and invoice stay together. If you split the move into separate records, the billing gets confusing and nobody can see the full picture when the customer calls to ask where their belongings are.</p>

<h2>What do long distance customers ask about most?</h2>
<p>They ask three questions, and your ability to answer them quickly separates you from competitors. Keeping the answers on the job record means anyone in the office can respond without hunting.</p>
<ol>
<li><strong>When will my belongings arrive?</strong> Delivery windows matter more than load dates on interstate work.</li>
<li><strong>What exactly is being shipped?</strong> An inventory list settles disputes before they start.</li>
<li><strong>What is the final price?</strong> Long distance quotes are large, so customers want certainty rather than a range.</li>
</ol>
<p>Storage in transit adds a fourth question about where their items are being held and for how long. Recording that on the job, rather than in someone's inbox, is what lets your office answer confidently at 4pm on a Friday when the customer calls anxious.</p>

<h2>Can one CRM handle both local and long distance work?</h2>
<p>Yes, and it should. Most moving companies do both, and running two systems doubles the admin. What you need is a single pipeline that tags job type, so local hourly work and long distance mileage work can be priced differently but reported together.</p>
<p>Movers CRM supports local, long distance, commercial, storage and labor only job types in one workspace. Estimates use the right rate structure for each, and reporting breaks results down by type so you can see which work is actually most profitable. You can compare it with <a href="/blog/best-crm-for-moving-companies">what makes a strong moving company CRM overall</a> or <a href="/">look at the full platform</a>.</p>
`,
    faqs: [
      { q: 'What is the best CRM for long distance movers?', a: 'The best option handles mileage based pricing, multi day scheduling and long follow up cycles in one pipeline. Movers CRM supports local, long distance, commercial and storage jobs in the same workspace.' },
      { q: 'How is long distance moving priced?', a: 'Most long distance quotes combine a per mile transit charge with hourly labor at each end plus materials. Larger job values mean estimating errors cost more, so accuracy matters more than on local moves.' },
      { q: 'How long is the sales cycle for long distance moves?', a: 'Often weeks or months, because customers plan relocations well ahead. That makes scheduled follow up the deciding factor, since many leads are lost simply by going quiet after the quote.' },
      { q: 'Can one system manage both local and interstate jobs?', a: 'Yes. A CRM that tags job type lets you price hourly local work and mileage based long distance work differently while reporting on both together, which avoids running two systems.' },
      { q: 'How should a multi day move be scheduled?', a: 'Keep load, transit and delivery attached to a single job record with separate crew assignments. Splitting it into different records makes billing and customer updates harder to manage.' },
    ],
  },
];
