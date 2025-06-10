// // // // import { Link } from "react-router-dom";
// // // // import { useAuth } from "../context/AuthContext";

// // // // function Navbar() {
// // // //   const { user, logout } = useAuth();

// // // //   const renderDashboardLink = () => {
// // // //     if (!user) return null;
// // // //     const role = user.role.toUpperCase();
// // // //     if (role === "STUDENT") return "/student-dashboard";
// // // //     if (role === "TUTOR") return "/tutor-dashboard";
// // // //     if (role === "ADMIN") return "/admin-dashboard";
// // // //   };

// // // //   const renderProfileLink = () => {
// // // //     if (!user) return null;
// // // //     if (user.role.toUpperCase() === "STUDENT") {
// // // //       return (
// // // //         <Link to="/student-profile" style={{ color: "white", marginRight: "1rem" }}>
// // // //           Profile
// // // //         </Link>
// // // //       );
// // // //     }
// // // //     return null;
// // // //   };

// // // //   return (
// // // //     <nav
// // // //       style={{
// // // //         display: "flex",
// // // //         justifyContent: "space-between",
// // // //         padding: "1rem 2rem",
// // // //         backgroundColor: "#333",
// // // //         color: "white"
// // // //       }}
// // // //     >
// // // //       <Link to="/" style={{ color: "white", fontWeight: "bold", textDecoration: "none" }}>
// // // //         🏠 Be Educated
// // // //       </Link>

// // // //       <div>
// // // //         {!user ? (
// // // //           <>
// // // //             <Link to="/login" style={{ color: "white", marginRight: "1rem" }}>Login</Link>
// // // //             <Link to="/signup" style={{ color: "white" }}>Signup</Link>
// // // //           </>
// // // //         ) : (
// // // //           <>
// // // //             <Link to={renderDashboardLink()} style={{ color: "white", marginRight: "1rem" }}>
// // // //               Dashboard
// // // //             </Link>
// // // //             {renderProfileLink()}
// // // //             <span style={{ marginRight: "1rem" }}>{user.email}</span>
// // // //             <button
// // // //               onClick={logout}
// // // //               style={{
// // // //                 background: "red",
// // // //                 color: "white",
// // // //                 border: "none",
// // // //                 padding: "0.5rem 1rem",
// // // //                 cursor: "pointer"
// // // //               }}
// // // //             >
// // // //               Logout
// // // //               {user?.role === "STUDENT" && (
// // // //   <Link to="/find-tutors" style={{ color: "white", marginRight: "1rem" }}>
// // // //     Find Tutors
// // // //   </Link>
// // // // )}

// // // //             </button>
// // // //           </>
// // // //         )}
// // // //       </div>
// // // //     </nav>
// // // //   );
// // // // }

// // // // export default Navbar;

// // // import { Link } from "react-router-dom";
// // // import { useAuth } from "../context/AuthContext";
// // // import "./Navbar.css";

// // // function Navbar() {
// // //   const { user, logout } = useAuth();

// // //   return (
// // //     <nav className="navbar">
// // //       <div className="navbar-brand">🏠 <Link to="/">Be Educated</Link></div>
// // //       <div className="navbar-links">
// // //         {!user ? (
// // //           <>
// // //             <Link to="/login">Login</Link>
// // //             <Link to="/signup">Signup</Link>
// // //           </>
// // //         ) : (
// // //           <>
// // //             {user.role === "ADMIN" && <Link to="/admin/users">Users</Link>}
// // //             <span>{user.email}</span>
// // //             <button className="logout-btn" onClick={logout}>Logout</button>
// // //           </>
// // //         )}
// // //       </div>
// // //     </nav>
// // //   );
// // // }

// // // export default Navbar;





// // import { Link } from "react-router-dom";
// // import { useAuth } from "../context/AuthContext";
// // import "./Navbar.css";

// // function Navbar() {
// //   const { user, logout } = useAuth();

// //   return (
// //     <nav className="navbar">
// //       <div className="navbar-left">
// //         <Link to="/" className="navbar-logo">🏠 Be Educated</Link>
// //       </div>
// //       <div className="navbar-right">
// //         {!user ? (
// //           <>
// //             <Link to="/login">Login</Link>
// //             <Link to="/signup">Signup</Link>
// //           </>
// //         ) : (
// //           <>
// //             <span>{user.email}</span>
// //             <button className="logout-btn" onClick={logout}>Logout</button>
// //           </>
// //         )}
// //       </div>
// //     </nav>
// //   );
// // }

// // export default Navbar;



// // // https://chatgpt.com/share/6846fcab-9e94-800e-aba4-f60eb1586250




// import { Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import "./Navbar.css";

// function Navbar() {
//   const { user, logout } = useAuth();

//   return (
//     <nav className="navbar">
//       <div className="container">
//         <div className="nav-content">
//           <div className="navbar-left">
//             <Link to="/" className="navbar-logo">
//               <div className="logo-container">
//                 <div className="logo-placeholder">
//                   📚
//                 </div>
//                 <span className="logo-text">Be Educated</span>
//               </div>
//             </Link>
//           </div>
//           <div className="navbar-right">
//             {!user ? (
//               <>
//                 <Link to="/login" className="nav-link">Login</Link>
//                 <Link to="/signup" className="nav-link signup-btn">Signup</Link>
//               </>
//             ) : (
//               <>
//                 <span className="user-email">{user.email}</span>
//                 <button className="logout-btn" onClick={logout}>Logout</button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;


import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-content">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <div className="logo-container">
              <div className="logo-placeholder">
                📚
              </div>
              <span className="logo-text">Be Educated</span>
            </div>
          </Link>
        </div>
        <div className="navbar-right">
          {!user ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="nav-link signup-btn">Signup</Link>
            </>
          ) : (
            <>
              <span className="user-email">{user.email}</span>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;