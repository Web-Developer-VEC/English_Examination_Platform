export default function RoleSelector({ role, setRole }) {

    return (

        <div className="flex rounded-lg overflow-hidden border mb-8">

            <button

                className={`flex-1 py-3 font-medium transition

                ${role==="student"

                    ?"bg-[#FDCC03]"

                    :"bg-white"

                }`}

                onClick={()=>setRole("student")}

            >

                Student

            </button>

            <button

                className={`flex-1 py-3 font-medium transition

                ${role==="professor"

                    ?"bg-[#FDCC03]"

                    :"bg-white"

                }`}

                onClick={()=>setRole("professor")}

            >

                Professor

            </button>

        </div>

    );

}