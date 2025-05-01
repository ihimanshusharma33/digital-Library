import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-orange-500 flex justify-center items-center">
      <img 
        src="https://himachal365.s3.ap-south-1.amazonaws.com/73/Igu-New-Logo-website-1.png" 
        alt="Logo" 
        className="w-auto lg:h-[14vh] md:h-[10vh]  sm:h-[4rem] object-contain"
      />
    </header>
  );
};

export default Header;
