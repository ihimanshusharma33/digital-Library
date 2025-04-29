import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-orange-500 flex justify-center items-center">
      <img 
        src="https://himachal365.s3.ap-south-1.amazonaws.com/73/Igu-New-Logo-website-1.png" 
        alt="Logo" 
        className="w-auto h-[14vh]"
      />
    </header>
  );
};

export default Header;
