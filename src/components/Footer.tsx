import { Link } from "react-router-dom";
import { FaDiscord, FaInstagram, FaTwitter, FaFacebook } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 py-6 md:py-8 shadow-elegant overflow-x-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div>
            <Link to="/" className="block mb-4">
              <img 
                src="/logo-footer.png" 
                alt="Your Drive" 
                className="h-12 md:h-14 w-auto"
                onError={(e) => {
                  console.error("Footer logo failed to load");
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </Link>
            <p className="text-gray-300 text-sm">
              Our vision is to provide convenience and help increase your sales
              business.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-white">About</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-gray-300 hover:text-orange-500 text-sm transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  to="/featured"
                  className="text-gray-300 hover:text-orange-500 text-sm transition-colors"
                >
                  Featured
                </Link>
              </li>
              <li>
                <Link
                  to="/partnership"
                  className="text-gray-300 hover:text-orange-500 text-sm transition-colors"
                >
                  Partnership
                </Link>
              </li>
              <li>
                <Link
                  to="/business-relation"
                  className="text-gray-300 hover:text-orange-500 text-sm transition-colors"
                >
                  Business Relation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-white">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/events"
                  className="text-gray-300 hover:text-orange-500 text-sm transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-gray-300 hover:text-orange-500 text-sm transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/podcast"
                  className="text-gray-300 hover:text-orange-500 text-sm transition-colors"
                >
                  Podcast
                </Link>
              </li>
              <li>
                <Link
                  to="/invite"
                  className="text-gray-300 hover:text-orange-500 text-sm transition-colors"
                >
                  Invite a friend
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-white">Socials</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-orange-500 text-sm flex items-center transition-colors"
                >
                  <FaDiscord className="mr-2" /> Discord
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-orange-500 text-sm flex items-center transition-colors"
                >
                  <FaInstagram className="mr-2" /> Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-orange-500 text-sm flex items-center transition-colors"
                >
                  <FaTwitter className="mr-2" /> Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-orange-500 text-sm flex items-center transition-colors"
                >
                  <FaFacebook className="mr-2" /> Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mt-6 md:mt-10 pt-4 md:pt-6 border-t border-gray-800 text-xs md:text-sm text-gray-300 gap-3 md:gap-0">
          <p className="mb-2 md:mb-0">©2025 Your Drive. All rights reserved</p>
          <a
            href="https://www.madebyrsln.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="italic text-center hover:text-orange-500 transition-colors"
          >
            Made by RSLN
          </a>
          <div className="flex flex-row space-x-4 mt-2 md:mt-0">
            <Link to="/privacy" className="hover:text-orange-500 transition-colors">
              Datenschutz
            </Link>
            <Link to="/terms" className="hover:text-orange-500 transition-colors">
              AGB
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
