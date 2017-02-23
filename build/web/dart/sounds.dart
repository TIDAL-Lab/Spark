/*
* Spark: Agent-based electrical circuit environment
* Copyright (c) 2013 Elham Beheshti
*
*       Elham Beheshti (beheshti@u.northwestern.edu)
*       Northwestern University, Evanston, IL
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License (version 2) as
* published by the Free Software Foundation.
*
* This program is distributed in the hope that it will be useful, but
* WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
* General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software
* Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
*/
part of SparkProject;


class Sounds {

  static AudioContext audio = new AudioContext();
  static Map sounds = new Map();


  static void loadSound(String name) {

    AudioElement audio = new AudioElement();
    audio.src = "sounds/$name.wav";
    sounds[name] = audio;
  }


  static void playSound(String name) {
    
    if (sounds[name] != null) {
      sounds[name].volume = 0.4;
      sounds[name].play();
    }
  }
}