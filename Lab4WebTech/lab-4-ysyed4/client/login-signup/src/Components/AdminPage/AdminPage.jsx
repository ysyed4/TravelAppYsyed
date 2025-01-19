import React, { useEffect, useState } from "react";
import "./AdminPage.css";

export const AdminPage = () => {
  const [publicLists, setPublicLists] = useState([]);
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPublicLists = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:3000/api/admin/public-lists",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch public destination lists");
        }
        const data = await response.json();
        setPublicLists(data);
      } catch (error) {
        console.error("Error fetching public destination lists:", error);
        setErrorMessage("Failed to load public destination lists.");
      }
    };

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:3000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user list");
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching user list:", error);
        setErrorMessage("Failed to load user list.");
      }
    };

    fetchPublicLists();
    fetchUsers();
  }, []);

  const handleReviewVisibilityChange = async (reviewId, hidden) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/admin/reviews/${reviewId}/hidden`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ hidden }),
        }
      );

      if (response.ok) {
        setPublicLists((prevLists) =>
          prevLists.map((list) => ({
            ...list,
            reviews: list.reviews.map((review) =>
              review._id === reviewId ? { ...review, hidden } : review
            ),
          }))
        );
      } else {
        console.error("Failed to update review visibility");
      }
    } catch (error) {
      console.error("Error updating review visibility:", error);
    }
  };

  const handleUserDisableChange = async (userId, disabled) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/admin/users/${userId}/disable`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ disabled }),
        }
      );

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, disabled } : user
          )
        );
      } else {
        console.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/admin/users/${userId}/roles`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "admin", action: "add" }),
        }
      );

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId
              ? { ...user, roles: [...user.roles, "admin"] }
              : user
          )
        );
        console.log("User has been granted admin privileges");
      } else {
        console.error("Failed to grant admin privileges");
      }
    } catch (error) {
      console.error("Error granting admin privileges:", error);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/admin/users/${userId}/roles`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "admin", action: "remove" }),
        }
      );

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId
              ? {
                  ...user,
                  roles: user.roles.filter((role) => role !== "admin"),
                }
              : user
          )
        );
        console.log("Admin privileges have been removed from the user");
      } else {
        console.error("Failed to remove admin privileges");
      }
    } catch (error) {
      console.error("Error removing admin privileges:", error);
    }
  };

  return (
    <div className="admin-container">
      <h1>Welcome Admin</h1>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="section-container">
        <h2 className="section-title">Public Destination Lists</h2>
        {publicLists.length > 0 ? (
          publicLists.map((list) => (
            <div key={list._id} className="public-list-item">
              <h3>{list.name}</h3>
              <p>Creator: {list.creatorNickname}</p>
              <p>Number of Destinations: {list.numDestinations}</p>
              <p>Average Rating: {list.averageRating}</p>
              <button
                onClick={() => {
                  setPublicLists((prevLists) =>
                    prevLists.map((prevList) =>
                      prevList._id === list._id
                        ? { ...prevList, expanded: !prevList.expanded }
                        : prevList
                    )
                  );
                }}
              >
                {list.expanded ? "Hide Details" : "View Details"}
              </button>
              {list.expanded && (
                <div className="list-details">
                  <p>
                    Description:{" "}
                    {list.description || "No Description Available"}
                  </p>
                  <div className="reviews-section">
                    <h4>Reviews:</h4>
                    {list.reviews && list.reviews.length > 0 ? (
                      list.reviews.map((review) => (
                        <div key={review._id} className="review-item">
                          <p>
                            <strong>
                              {review.user?.nickname || "Anonymous"}
                            </strong>{" "}
                            - {new Date(review.createdAt).toLocaleString()}
                          </p>
                          <p>Rating: {review.rating}/5</p>
                          <p>{review.comment}</p>
                          <label>
                            <input
                              type="checkbox"
                              checked={review.hidden}
                              onChange={(e) =>
                                handleReviewVisibilityChange(
                                  review._id,
                                  e.target.checked
                                )
                              }
                            />
                            Hide Review
                          </label>
                        </div>
                      ))
                    ) : (
                      <p>No reviews yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No public destination lists found</p>
        )}
      </div>

      <div className="section-container">
        <h2 className="section-title">User Management</h2>
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user._id} className="user-item">
              <p>
                <strong>Nickname:</strong> {user.nickname}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Status:</strong> {user.disabled ? "Disabled" : "Active"}
              </p>
              <p>
                <strong>Roles:</strong> {user.roles.join(", ")}
              </p>
              <button
                onClick={() =>
                  handleUserDisableChange(user._id, !user.disabled)
                }
              >
                {user.disabled ? "Enable User" : "Disable User"}
              </button>
              <button
                onClick={() => handleMakeAdmin(user._id)}
                disabled={user.roles.includes("admin")}
              >
                Make Admin
              </button>
              <button
                onClick={() => handleRemoveAdmin(user._id)}
                disabled={!user.roles.includes("admin")}
              >
                Remove Admin
              </button>
            </div>
          ))
        ) : (
          <p>No users found</p>
        )}
      </div>
    </div>
  );
};
