export default function LoginForm({ role }) {

    return (

        <form>

            <h2 className="text-2xl font-semibold text-center text-[#800000] mb-6">

                {role === "student"

                    ? "Student Login"

                    : "Professor Login"

                }

            </h2>

            <div className="mb-4">
                <label className="block mb-2 font-medium">
                    {role === "student"
                        ? "University Register Number"
                        : "Email Address"}
                </label>

                <input
                    type={role === "student" ? "text" : "email"}
                    placeholder={
                        role === "student"
                            ? "Enter your register number"
                            : "Enter your email"
                    }
                    className="w-full border rounded-lg px-4 py-3"
                />

            </div>

            <div className="mb-6">

                <label className="block mb-2">

                    Password

                </label>

                <input

                    type="password"

                    className="w-full border rounded-lg px-4 py-3"

                    placeholder="Enter password"

                />

            </div>

            <button

                className="w-full bg-[#FDCC03] rounded-lg py-3 font-semibold"

            >

                Login

            </button>

            <p className="text-center text-sm text-gray-500 mt-6">
                    {role === "student"
                        ? <div>Forgot your password?😭 <br/> Contact your mentor</div> :
                        <div>Forgot your password?<br/> Ask other admin to reset the password</div> 
                    }

            </p>

        </form>

    );

}