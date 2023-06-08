// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Appointment {
    /* DATA STRUCTURES */

    struct appointment {
        string date;
        string time;
        address patient;
        string patient_name;
        address doctor;
        string doctor_name;
        string status;
    }

    mapping(address => appointment[]) public PATIENTS;
    mapping(address => appointment[]) public DOCTORS;

    /* UTILITY FUNCTIONS */

    function compare(
        string memory str1,
        string memory str2
    ) public pure returns (bool) {
        return
            keccak256(abi.encodePacked(str1)) ==
            keccak256(abi.encodePacked(str2));
    }

    function get_count(
        uint _role,
        string memory _filter,
        address _addr
    ) private view returns (uint) {
        uint count = 0;
        if (_role == 0) {
            // patient
            for (uint i = 0; i < PATIENTS[_addr].length; i++) {
                if (compare(PATIENTS[_addr][i].status, _filter)) {
                    count++;
                }
            }
        } else {
            // doctor
            for (uint i = 0; i < DOCTORS[_addr].length; i++) {
                if (compare(DOCTORS[_addr][i].status, _filter)) {
                    count++;
                }
            }
        }
        return count;
    }

    function find_doctor_actual_index(
        uint _index,
        string memory _filter
    ) private view returns (uint) {
        uint count = 0;
        uint pos = 0;
        for (uint i = 0; i < DOCTORS[msg.sender].length; i++) {
            if (compare(DOCTORS[msg.sender][i].status, _filter)) {
                count++;
                if ((count - 1) == _index) {
                    pos = i;
                    break;
                }
            }
        }
        return pos;
    }

    function find_patient_actual_index(
        uint _index,
        string memory _filter
    ) private view returns (uint) {
        uint count = 0;
        uint pos = 0;
        for (uint i = 0; i < PATIENTS[msg.sender].length; i++) {
            if (compare(PATIENTS[msg.sender][i].status, _filter)) {
                count++;
                if ((count - 1) == _index) {
                    pos = i;
                    break;
                }
            }
        }
        return pos;
    }

    // delete appointment in doctor's list iteratively
    function iterative_delete(uint _index, address _doctor) private {
        for (uint i = _index; i < DOCTORS[_doctor].length - 1; i++) {
            DOCTORS[_doctor][i] = DOCTORS[_doctor][i + 1];
        }
        DOCTORS[_doctor].pop();
    }

    // delete appointment in doctor's list when patient deletes his request or cancels his appointment
    function delete_appointment(
        address _doctor,
        address _patient,
        string memory _date
    ) private {
        uint target = DOCTORS[_doctor].length + 4;
        for (uint i = 0; i < DOCTORS[_doctor].length; i++) {
            if (
                DOCTORS[_doctor][i].patient == _patient &&
                compare(DOCTORS[_doctor][i].date, _date) == true
            ) {
                target = i;
                break;
            }
        }
        if (target < DOCTORS[_doctor].length) {
            iterative_delete(target, _doctor);
        }
    }

    // change status and time in patient's list when doctor confirms or rejects/cancels an appointment
    function change_patient_status(
        address _patient,
        address _doctor,
        string memory _prev,
        string memory _next,
        string memory _date,
        string memory _time
    ) private {
        for (uint i = 0; i < PATIENTS[_patient].length; i++) {
            if (
                PATIENTS[_patient][i].doctor == _doctor &&
                compare(PATIENTS[_patient][i].date, _date) == true &&
                compare(PATIENTS[_patient][i].status, _prev) == true
            ) {
                if (compare(_time, "") == false) {
                    PATIENTS[_patient][i].time = _time;
                }
                PATIENTS[_patient][i].status = _next;
            }
        }
    }

    /* DOCTOR FUNCTIONS */

    // doctor to see all appointment requests
    // function get_appointment_requests()
    //     public
    //     view
    //     returns (appointment[] memory)
    // {
    //     return DOCTORS[msg.sender];
    // }

    // doctor to confirm an appointment by specifying a time
    function confirm_appointment(uint _index, string memory _time) public {
        // _index is in pending requests. Find actual index
        uint pos = find_doctor_actual_index(_index, "Pending");

        // change status and time in doctor's list
        DOCTORS[msg.sender][pos].time = _time;
        DOCTORS[msg.sender][pos].status = "Confirmed";

        address _patient = DOCTORS[msg.sender][pos].patient;
        string memory _date = DOCTORS[msg.sender][pos].date;

        // change status and time in patient's list
        change_patient_status(
            _patient,
            msg.sender,
            "Pending",
            "Confirmed",
            _date,
            _time
        );
    }

    // doctor to see pending appointment requests
    function get_pending_requests() public view returns (appointment[] memory) {
        appointment[] memory requests = new appointment[](
            get_count(1, "Pending", msg.sender)
        );
        uint k = 0;
        for (uint i = 0; i < DOCTORS[msg.sender].length; i++) {
            if (compare(DOCTORS[msg.sender][i].status, "Pending")) {
                requests[k] = DOCTORS[msg.sender][i];
                k++;
            }
        }
        return requests;
    }

    // doctor to see confirmed appointments
    function get_confirmed_appointments()
        public
        view
        returns (appointment[] memory)
    {
        appointment[] memory confirmed = new appointment[](
            get_count(1, "Confirmed", msg.sender)
        );
        uint k = 0;
        for (uint i = 0; i < DOCTORS[msg.sender].length; i++) {
            if (compare(DOCTORS[msg.sender][i].status, "Confirmed")) {
                confirmed[k] = DOCTORS[msg.sender][i];
                k++;
            }
        }
        return confirmed;
    }

    // doctor to reject a pending appointment request
    function reject_pending_request(uint _index) public {
        // _index is in pending requests. Find actual index
        uint pos = find_doctor_actual_index(_index, "Pending");

        address _patient = DOCTORS[msg.sender][pos].patient;
        string memory _date = DOCTORS[msg.sender][pos].date;

        // change status in patient's list
        change_patient_status(
            _patient,
            msg.sender,
            "Pending",
            "Rejected",
            _date,
            ""
        );

        // remove appointment from doctor's list
        iterative_delete(pos, msg.sender);
    }

    // doctor to cancel a confirmed appointment
    function cancel_confirmed_appointment(uint _index) public {
        // _index is in confirmed requests. Find actual index
        uint pos = find_doctor_actual_index(_index, "Confirmed");

        address _patient = DOCTORS[msg.sender][pos].patient;
        string memory _date = DOCTORS[msg.sender][pos].date;

        // change status in patient's list
        change_patient_status(
            _patient,
            msg.sender,
            "Confirmed",
            "Cancelled",
            _date,
            ""
        );

        // remove appointment from doctor's list
        iterative_delete(pos, msg.sender);
    }

    // doctor to mark a confirmed appointment as complete
    function mark_as_complete(uint _index) public {
        // _index is in confirmed requests. Find actual index
        uint pos = find_doctor_actual_index(_index, "Confirmed");

        // change status and time in doctor's list
        DOCTORS[msg.sender][pos].status = "Complete";

        address _patient = DOCTORS[msg.sender][pos].patient;
        string memory _date = DOCTORS[msg.sender][pos].date;

        // change status in patient's list
        change_patient_status(
            _patient,
            msg.sender,
            "Confirmed",
            "Complete",
            _date,
            ""
        );
    }

    /* PATIENT FUNCTIONS */

    // patient to request an appointment by specifying date and doctor address
    function request_appointment(
        string memory _patient,
        string memory _doctor,
        string memory _date,
        address docAddr
    ) public {
        // insert appointment in doctor's map
        DOCTORS[docAddr].push(
            appointment(
                _date,
                "",
                msg.sender,
                _patient,
                docAddr,
                _doctor,
                "Pending"
            )
        );

        // insert appointment in patient's map
        PATIENTS[msg.sender].push(
            appointment(
                _date,
                "",
                msg.sender,
                _patient,
                docAddr,
                _doctor,
                "Pending"
            )
        );
    }

    // patient to see the appointment requests
    function patient_get_all_appointments()
        public
        view
        returns (appointment[] memory)
    {
        return PATIENTS[msg.sender];
    }

    // patient to see pending requests
    function patient_get_pending_requests()
        public
        view
        returns (appointment[] memory)
    {
        appointment[] memory requests = new appointment[](
            get_count(0, "Pending", msg.sender)
        );
        uint k = 0;
        for (uint i = 0; i < PATIENTS[msg.sender].length; i++) {
            if (compare(PATIENTS[msg.sender][i].status, "Pending")) {
                requests[k] = PATIENTS[msg.sender][i];
                k++;
            }
        }
        return requests;
    }

    // patient to see confirmed appointments
    function patient_get_confirmed_appointments()
        public
        view
        returns (appointment[] memory)
    {
        appointment[] memory confirmed = new appointment[](
            get_count(0, "Confirmed", msg.sender)
        );
        uint k = 0;
        for (uint i = 0; i < PATIENTS[msg.sender].length; i++) {
            if (compare(PATIENTS[msg.sender][i].status, "Confirmed")) {
                confirmed[k] = PATIENTS[msg.sender][i];
                k++;
            }
        }
        return confirmed;
    }

    // patient to delete a pending appointment request
    function patient_delete_pending_request(uint _index) public {
        uint pos = find_patient_actual_index(_index, "Pending");

        // change status in patient's list
        PATIENTS[msg.sender][pos].status = "Deleted";

        address _doctor = PATIENTS[msg.sender][pos].doctor;
        string memory _date = PATIENTS[msg.sender][pos].date;

        // remove appointment from doctor's list
        delete_appointment(_doctor, msg.sender, _date);
    }

    // patient to cancel a confirmed appointment
    function patient_cancel_confirmed_appointment(uint _index) public {
        uint pos = find_patient_actual_index(_index, "Confirmed");

        // change status in patient's list
        PATIENTS[msg.sender][pos].status = "Cancelled";

        address _doctor = PATIENTS[msg.sender][pos].doctor;
        string memory _date = PATIENTS[msg.sender][pos].date;

        // remove appointment from doctor's list
        delete_appointment(_doctor, msg.sender, _date);
    }
}