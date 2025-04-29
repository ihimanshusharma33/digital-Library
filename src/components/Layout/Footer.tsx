import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-orange-500 text-white text-center py-4  ">
      <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
      <p>
        Any questions? Contact us at{' '}
        <a href="mailto:support@example.com" className="underline">
          support@example.com
        </a>
      </p>
    </footer>
  );
};

export default Footer;
