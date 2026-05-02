import React from 'react';

export default function MobileFrame({ children }) {
  return (
    <div className="mobile-frame mx-auto my-6">
      <div className="device">
        <div className="notch" />
        <div className="screen">{children}</div>
      </div>
    </div>
  );
}
