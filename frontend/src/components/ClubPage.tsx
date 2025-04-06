import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface InstagramAccount {
  handle: string;
  name: string;
}

const AVAILABLE_ACCOUNTS: InstagramAccount[] = [
  { handle: 'psa_ucf', name: 'Pakistani Student Association' },
  { handle: 'knighthacks', name: 'Knight Hacks' },
  { handle: 'girlswhocodeucf', name: 'Girls Who Code' },
  { handle: 'bsaucf', name: 'Bengali Student Association' },
  { handle: 'ucfcecs', name: 'Engineering and Computer Science' },
  { handle: 'ucf_osi', name: 'Office of Student Involvement' },
  { handle: 'ucf_cab', name: 'Campus Activities Board' },
  { handle: 'shpeucf', name: 'Society of Hispanic Professional Engineers' },
  { handle: 'ucf_robotics', name: 'Robotics Club of Central Florida' },
  { handle: 'badminton_ucf', name: 'Badminton Club' },
  { handle: 'punjabiatucf', name: 'Punjabi Student Association' },
  { handle: 'msa_ucf', name: 'Muslim Student Association' },
  { handle: 'gj.ucf', name: 'Gujarati Student Club' },
  { handle: 'saseucf', name: 'Society of Asian Scientists and Engineers' },
  { handle: 'ieeeucf', name: 'Institute of Electrical and Electronics Engineers' }
];

const ClubPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load previously selected accounts from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setSelectedAccounts(parsedUser.followedAccounts || []);
    }
  }, []);

  const handleAccountToggle = (handle: string) => {
    setSelectedAccounts(prev => {
      const newSelected = prev.includes(handle)
        ? prev.filter(h => h !== handle)
        : [...prev, handle];
      
      // Update localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        parsedUser.followedAccounts = newSelected;
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
      
      return newSelected;
    });
  };

  const filteredAccounts = AVAILABLE_ACCOUNTS.filter(account =>
    !selectedAccounts.includes(account.handle) && (
      account.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="club-page">
      <header className="club-header">
        <div>
          <h1>Club Settings</h1>
          <p>Manage your followed clubs and events</p>
        </div>
        <button 
          className="create-event-btn"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </header>

      <div className="club-layout">
        <div className="club-search-section">
          <h2>Search Clubs</h2>
          <div className="club-search">
            <input
              type="text"
              placeholder="Search clubs to follow..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
            />
            {showSearchResults && searchTerm && (
              <div className="search-results">
                {filteredAccounts.length === 0 ? (
                  <div className="no-results">No clubs found</div>
                ) : (
                  filteredAccounts.map((account) => (
                    <div 
                      key={account.handle} 
                      className="search-result-item"
                      onClick={() => {
                        handleAccountToggle(account.handle);
                        setSearchTerm('');
                        setShowSearchResults(false);
                      }}
                    >
                      <div className="account-info">
                        <div className="account-name">{account.name}</div>
                        <div className="account-handle">@{account.handle}</div>
                      </div>
                      <button className="follow-btn">Follow</button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="club-following-section">
          <h2>Following</h2>
          <div className="club-following-list">
            {selectedAccounts.length === 0 ? (
              <div className="no-following">No clubs followed yet</div>
            ) : (
              selectedAccounts.map((handle) => {
                const account = AVAILABLE_ACCOUNTS.find(acc => acc.handle === handle);
                return account ? (
                  <div key={handle} className="club-following-item">
                    <div className="following-info">
                      <div className="following-name">{account.name}</div>
                      <div className="following-handle">@{handle}</div>
                    </div>
                    <button 
                      className="unfollow-btn"
                      onClick={() => handleAccountToggle(handle)}
                    >
                      Unfollow
                    </button>
                  </div>
                ) : null;
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubPage; 