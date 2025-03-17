function LoggedInName() {
    const _ud = localStorage.getItem('user_data');
  
    if (_ud === null) {
      // Handle the case where user_data is not found in localStorage
      // For example, redirect to the login page or display an error message
      window.location.href = '/'; // Redirect to login if user data is missing
      return null; // Return null to prevent further rendering
    }
  
    const ud = JSON.parse(_ud);
    const userId = ud.id;
    const firstName = ud.firstName;
    const lastName = ud.lastName;
  
    const doLogout = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      localStorage.removeItem('user_data');
      window.location.href = '/';
    };
  
    return (
      <div id="loggedInDiv">
        <span id="userName">Logged In As {firstName} {lastName}</span>
        <br />
        <button type="button" id="logoutButton" className="buttons" onClick={doLogout}>
          Log Out
        </button>
      </div>
    );
  }
  
  export default LoggedInName;