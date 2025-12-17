import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-white">
          Terms & Conditions
        </h1>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              1. Rental Agreement
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By booking a vehicle through Your Drive, you agree to these Terms & Conditions. The rental agreement is between you and Your Drive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              2. Driver Requirements
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              To rent a vehicle, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Be at least 21 years old (25 for premium vehicles)</li>
              <li>Hold a valid driver's license for at least 1 year</li>
              <li>Provide valid identification and payment method</li>
              <li>Have a clean driving record</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              3. Booking and Payment
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              All bookings require a valid credit card. Payment is processed at the time of booking. Prices include VAT and are subject to change.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              4. Cancellation Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Cancellations made more than 24 hours before pickup are fully refundable. Cancellations within 24 hours may be subject to fees.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              5. Vehicle Use and Restrictions
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Vehicles must be used in accordance with local traffic laws. Prohibited uses include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Off-road driving</li>
              <li>Racing or competitive driving</li>
              <li>Transporting illegal substances</li>
              <li>Driving under the influence</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              6. Liability and Insurance
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Basic insurance is included. Additional coverage options are available. You are responsible for any damage to the vehicle during the rental period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              7. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions about these Terms & Conditions, please contact us at:
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Email: legal@yourdrive.com<br />
              Phone: +49 (0) 123 456 789
            </p>
          </section>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
            Last updated: December 2025
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
