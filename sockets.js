const QUESTION_TIME = 8000;

let currentQuestionIndex;

let candidatesData = [];
let Rooms = [];
let answerTime;

function candidateExist(name) {
   for (let obj of candidatesData) {
      if (name.toLowerCase() === obj.candidateName.toLowerCase()) {
         return true;
      }
   }
   return false;
}

function getQuestions(room) {
   for (let obj of Rooms) {
      if (obj.room == room) {
         return obj.questions;
      }
   }
   return [];
}

function removeRoom(room) {
   Rooms = Rooms.filter((r) => r.room != room);
   removeCondidateByRoom(room);
}

function roomExist(room) {
   for (let obj of Rooms) {
      if (obj.room == room) {
         return true;
      }
   }
   return false;
}

function removeCondidateByRoom(room) {
   candidatesData = candidatesData.filter((c, i) => c.room != room);
}

function removeCondidateById(id) {
   candidatesData = candidatesData.filter((c, i) => c.id != id);
}

function getCandidateById(id) {
   return candidatesData.filter((c) => c.id === id);
}

function listen(io) {
   const quizNamespace = io.of("/quiz");

   quizNamespace.on("connection", (socket) => {
      console.log("a user connected", socket.id);

      socket.on("create-room", (data) => {
         if (!roomExist(data.room.toLowerCase())) {
            Rooms.push(data);

            //questionsData = data.questions;
            console.log("room created");
            socket.join(data.room);
            socket.emit("room-status", {
               roomIsCreated: true,
            });
         } else {
            console.log("room already exist !");
            socket.emit("room-status", {
               roomIsCreated: false,
            });
         }
      });

      socket.on("joind-room", (data) => {
         var error = "";
         if (roomExist(data.clientRoom)) {
            if (!candidateExist(data.candidateName)) {
               socket.join(data.clientRoom);
               candidatesData.push({
                  id: socket.id,
                  candidateName: data.candidateName,
                  score: 0,
                  room: data.clientRoom,
               });
            } else {
               error = "this name is already taken !";
            }
         } else {
            error = "room not exist !";
         }
         quizNamespace.in(data.clientRoom).emit("candidate-joind", {
            candidatesData,
            error: error,
         });
      });

      socket.on("start-quiz", ({ roomName }) => {
         const Questions = getQuestions(roomName);

         if (roomExist(roomName) && Questions.length > 0) {
            currentQuestionIndex = 0;

            // send the first question
            quizNamespace.in(roomName).emit("update-question", {
               question: Questions[currentQuestionIndex].question,
               choices: Questions[currentQuestionIndex].choices,
            });
            answerTime = Date.now();

            // send the others question
            var timeout = setInterval(function () {
               if (currentQuestionIndex >= Questions.length - 1) {
                  quizNamespace.in(roomName).emit("quiz-over");
                  removeRoom(roomName);
                  clearInterval(timeout);
               } else {
                  currentQuestionIndex++;
                  quizNamespace.in(roomName).emit("update-question", {
                     question: Questions[currentQuestionIndex].question,
                     choices: Questions[currentQuestionIndex].choices,
                  });
                  answerTime = Date.now();
               }
            }, QUESTION_TIME);
         }
      });

      socket.on("send-answer", (data) => {
         if (currentQuestionIndex < getQuestions(data.room).length) {
            if (
               getQuestions(data.room)[currentQuestionIndex].answer ==
               data.answer
            ) {
               for (const obj of candidatesData) {
                  if (obj.id == socket.id) {
                     score = Math.floor(
                        (QUESTION_TIME - (Date.now() - answerTime)) * 0.01
                     );
                     obj.score += score;
                  }
               }
            }
         }

         quizNamespace.in(data.room).emit("update-score", {
            candidatesData,
         });
      });

      socket.on("disconnect", (reason) => {
         console.log(`Client ${socket.id} disconnected: ${reason}`);

         if (getCandidateById(socket.id).length > 0) {
            let room = getCandidateById(socket.id)[0].room;

            removeCondidateById(socket.id);
            socket.leave(room);
            quizNamespace.in(room).emit("candidate-joind", {
               candidatesData,
            });
         }
      });
   });
}

module.exports = {
   listen,
};
