import React, { useState } from 'react';
import './App.css';  

interface Club {
    id: number;
    name: string;
}

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
}

const AccountAndClubManagement: React.FC = () => {
    const [view, setView] = useState<'settings' | 'clubs'>('settings');
    const [clubs, setClubs] = useState<Club[]>([
        { id: 1, name: 'Chess Club' },
        { id: 2, name: 'Science Club' }
    ]);
    const [newClubName, setNewClubName] = useState('');
    const [profile, setProfile] = useState<UserProfile>({
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com'
    });

    const handleAddClub = () => {
        if (newClubName.trim()) {
            setClubs(prevClubs => [...prevClubs, {
                id: Date.now(),
                name: newClubName.trim()
            }]);
            setNewClubName('');
        }
    };

    const handleRemoveClub = (id: number) => {
        setClubs(prevClubs => prevClubs.filter(club => club.id !== id));
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Add API call to update profile
        console.log('Updating profile:', profile);
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="app-container">
            <button onClick={() => setView('settings')}>Account Settings</button>
            <button onClick={() => setView('clubs')}>Club Management</button>

            {view === 'settings' && (
                <div className="profile-area">
                    <div className="profile-pic"></div>
                    <div className="name">{`${profile.firstName} ${profile.lastName}`}</div>
                    <form onSubmit={handleProfileSubmit}>
                        <label htmlFor="firstName">First Name</label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={profile.firstName}
                            onChange={handleProfileChange}
                        />
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={profile.lastName}
                            onChange={handleProfileChange}
                        />
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                        />
                        <button type="button">Change Password</button>
                        <button type="submit">Save Changes</button>
                    </form>
                </div>
            )}

            {view === 'clubs' && (
                <div className="container">
                    <h2>Club List</h2>
                    <div className="club-input-container">
                        <input
                            type="text"
                            value={newClubName}
                            onChange={(e) => setNewClubName(e.target.value)}
                            placeholder="Enter club name"
                        />
                        <button className="add-btn" onClick={handleAddClub}>Add Club</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Club Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clubs.map(club => (
                                <tr key={club.id}>
                                    <td>{club.name}</td>
                                    <td className="actions">
                                        <button className="edit-btn">Edit</button>
                                        <button 
                                            className="delete-btn" 
                                            onClick={() => handleRemoveClub(club.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AccountAndClubManagement;
