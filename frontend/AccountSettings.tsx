import React, { useState } from 'react';
import './App.css';  
//

const AccountAndClubManagement: React.FC = () => {
    const [view, setView] = useState<'settings' | 'clubs'>('settings');

    const handleAddClub = () => {
        const clubInput = document.getElementById('clubInput') as HTMLInputElement;
        const clubName = clubInput.value.trim();
        if (clubName) {
            const table = document.getElementById('clubTable') as HTMLTableElement;
            const row = table.insertRow();
            const cell1 = row.insertCell(0);
            const cell2 = row.insertCell(1);
            cell1.textContent = clubName;
            cell2.innerHTML = `
                <button class="edit-btn"> Edit</button>
                <button class="delete-btn" onClick={() => handleRemoveClub(row)}>Delete</button>
            `;
            clubInput.value = '';
        }
    };

    const handleRemoveClub = (row: HTMLTableRowElement) => {
        row.parentNode!.removeChild(row);
    };

    return (
        <div className="app-container">
            <button onClick={() => setView('settings')}>Account Settings</button>
            <button onClick={() => setView('clubs')}>Club Management</button>

            {view === 'settings' && (
                <div className="profile-area">
                    <div className="profile-pic"></div>
                    <div className="name">John Doe</div>
                    <form>
                        <label htmlFor="first-name">First Name</label>
                        <input id="first-name" type="text" defaultValue="John" />
                        <label htmlFor="last-name">Last Name</label>
                        <input id="last-name" type="text" defaultValue="Doe" />
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" defaultValue="johndoe@example.com" />
                        <button type="button">Change Password</button>
                        <button type="submit">Save Changes</button>
                    </form>
                </div>
            )}

            {view === 'clubs' && (
                <div className="container">
                    <h2>Club List</h2>
                    <input type="text" id="clubInput" placeholder="Enter club name" />
                    <button className="add-btn" onClick={handleAddClub}>Add Club</button>
                    <table>
                        <thead>
                            <tr>
                                <th>Club Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="clubTable">
                            {/* Example row */}
                            <tr>
                                <td>Chess Club</td>
                                <td className="actions">
                                    <button className="edit-btn">Edit</button>
                                    <button className="delete-btn" onClick={() => {}}>Delete</button>
                                    {/* need icon??*/}
                                </td>
                            </tr>
                            <tr>
                                <td>Science Club</td>
                                <td className="actions">
                                    <button className="edit-btn">Edit</button>
                                    <button className="delete-btn" onClick={() => {}}>Delete</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AccountAndClubManagement;
