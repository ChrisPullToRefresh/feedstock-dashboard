Hey Chris,

Wow, love that the essentials are in place so fast.

Yes, this is all the core essential functionality, and everything worked for me.

I was able to create feedstock suppliers and sequestration sites and log kg of garbage for both. I was also able to see everything I had logged in the transactions list and filter the transactions list, which was a nice touch but may need to be tucked away a little more to not distract from the primary weight logging feature.

So let’s do these features next so we can get this into production and stop using spreadsheets:

When I archive a sequestration site, we need the kg logged to also get archived and disappear from the logs and per-site totals. Also, archive is a nice feature, but let’s also have delete, which will fully eliminate any record from the database. While we are still testing, that hard delete is useful to get rid of all the test data.
Let’s install mobile-friendly up and down arrows. Two up arrows that give +1 kg and +1/10th of a kg, and two down arrows that give -1 kg and -1/10th of a kg. Large buttons so that the staff can easily click through their PPE gloves and so they don’t need to be typing in tiny numbers.
Default the web app to the logging screen rather than the transaction list. And don’t make us pick the feedstock supplier over and over again. If the last one was Supplier A, the next one should default to Supplier A. Same with sequestration sites.
Every time it says “producers,” change that to “feedstock suppliers.”
The tabs for “feedstock suppliers” and “sequestration sites” are good, but let’s combine the other 2 tabs into one view called “logging,” and make that the default view of the web app. A dropdown picker will select between “incoming” and “outgoing,” and the transactions will appear below a line that separates the data entry area from the list of transactions below it. This way, at a glance, we can see our recent transactions, giving us greater assurance they happened. And what about the transaction filters? Let’s put them all in a filter popup. Since we rarely need to filter, defaulting to reverse chronological order is more useful than having front-and-center filters.
Let’s add timestamps and transaction IDs to each recording as well, plus a download button to download each transaction itself for auditing purposes.
On the feedstock suppliers tab, display 3 metrics next to each supplier: today’s total, total for the last calendar month, and total since the first of this month.
Let any one of those 3 metrics be the sorting factor for the list, defaulting to “total since 1st of month.” This way, the most active sites and feedstock suppliers cling to the top of our view.
Once that’s in place, we’ll be able to manually create invoices from this tool by looking at last month’s totals, maintain a handle on our monthly performance, and have a good, easy-to-use data entry dashboard.

Eventually, let’s evolve this to take the load cell data from our IoT device. And to automatically build an invoice complete with transaction log reports and add audit photos to every logged weight. This will allow for a single-click end-of-month process and enable payment logging so we can track earnings and collections. I also imagine we can add logins so suppliers and sequestration sites can access this portal and see their own totals and balances due. They would see a stripped-down view showing only their transaction history for auditing purposes, without the ability to log data or see others’ information.

This is coming together really great, and I’m very excited to see it take shape. Let me know when items 1–8 above are ready for review. Of course, we’ll address the future concepts after that.
	

Arin Crumley